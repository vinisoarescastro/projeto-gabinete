import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Rota GET - Listar todos os usuários (ativos E inativos)
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, nivel_permissao, ativo, ultimo_acesso')
            .order('ativo', { ascending: false }) // Ativos primeiro
            .order('nome_completo', { ascending: true }); // Depois por nome

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            usuarios: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar usuários',
            erro: error.message
        });
    }
});

// Rota GET - Listar usuários com estatísticas de acesso
router.get('/stats/acessos', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, nivel_permissao, ativo, criado_em, ultimo_acesso')
            .order('ativo', { ascending: false }) // Ativos primeiro
            .order('ultimo_acesso', { ascending: false, nullsFirst: false }); // Depois por último acesso

        if (error) throw error;

        // Adicionar informações de status de acesso
        const usuariosComStatus = data.map(usuario => {
            let dias_sem_acessar = null;
            let status_acesso = 'Nunca acessou';

            if (usuario.ultimo_acesso) {
                const agora = new Date();
                const ultimoAcesso = new Date(usuario.ultimo_acesso);
                const diffMs = agora - ultimoAcesso;
                dias_sem_acessar = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (dias_sem_acessar === 0) {
                    status_acesso = 'Ativo hoje';
                } else if (dias_sem_acessar === 1) {
                    status_acesso = 'Inativo há 1 dia';
                } else if (dias_sem_acessar <= 7) {
                    status_acesso = `Inativo há ${dias_sem_acessar} dias`;
                } else if (dias_sem_acessar <= 30) {
                    const semanas = Math.floor(dias_sem_acessar / 7);
                    status_acesso = `Inativo há ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
                } else {
                    const meses = Math.floor(dias_sem_acessar / 30);
                    status_acesso = `Inativo há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
                }
            }

            return {
                ...usuario,
                dias_sem_acessar,
                status_acesso
            };
        });

        res.json({
            sucesso: true,
            quantidade: usuariosComStatus.length,
            usuarios: usuariosComStatus
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar usuários',
            erro: error.message
        });
    }
});

// Rota GET - Buscar usuário específico por ID
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, nivel_permissao, ativo, criado_em, ultimo_acesso')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado'
                });
            }
            throw error;
        }

        res.json({
            sucesso: true,
            usuario: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar usuário',
            erro: error.message
        });
    }
});

// Rota PUT - Editar usuário
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_completo, email, nivel_permissao } = req.body;
        const usuarioLogado = req.usuario;

        // Verificar permissões
        if (!['administrador', 'chefe_gabinete'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para editar usuários'
            });
        }

        // Validação
        if (!nome_completo || !email || !nivel_permissao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se o email já existe em outro usuário
        const { data: emailExiste } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .neq('id', id)
            .single();

        if (emailExiste) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este email já está sendo usado por outro usuário'
            });
        }

        // Atualizar usuário
        const { data, error } = await supabase
            .from('usuarios')
            .update({
                nome_completo,
                email,
                nivel_permissao
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Usuário atualizado com sucesso!',
            usuario: data[0]
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar usuário',
            erro: error.message
        });
    }
});

// Rota PATCH - Ativar/Desativar usuário
router.patch('/:id/status', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;
        const usuarioLogado = req.usuario;

        // Verificar permissões
        if (!['administrador', 'chefe_gabinete'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para alterar status de usuários'
            });
        }

        // Não permitir desativar a si mesmo
        if (parseInt(id) === usuarioLogado.id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Você não pode desativar seu próprio usuário'
            });
        }

        // Atualizar status
        const { data, error } = await supabase
            .from('usuarios')
            .update({ ativo })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso!`,
            usuario: data[0]
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao alterar status do usuário',
            erro: error.message
        });
    }
});

// Rota POST - Resetar senha do usuário
router.post('/:id/resetar-senha', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioLogado = req.usuario;

        // Verificar permissões
        if (!['administrador', 'chefe_gabinete'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para resetar senhas'
            });
        }

        // Senha padrão
        const SENHA_PADRAO = 'Senha123!';
        const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

        // Atualizar senha
        const { data, error } = await supabase
            .from('usuarios')
            .update({ 
                senha_hash: senhaHash,
                senha_temporaria: true
            })
            .eq('id', id)
            .select('id, nome_completo, email');

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Senha resetada com sucesso! Nova senha: Senha123!',
            usuario: data[0]
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao resetar senha',
            erro: error.message
        });
    }
});

export default router;