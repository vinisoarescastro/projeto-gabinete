import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota GET - Listar todos os usuários ativos (COM último acesso)
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, nivel_permissao, ativo, criado_em, ultimo_acesso')
            .eq('ativo', true)
            .order('nome_completo', { ascending: true });

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

// Rota GET - Listar usuários com estatísticas de acesso
router.get('/stats/acessos', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;

        // Apenas admins e chefes podem ver estatísticas
        if (!['administrador', 'chefe_gabinete'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para acessar estas estatísticas'
            });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, nivel_permissao, ativo, criado_em, ultimo_acesso')
            .eq('ativo', true)
            .order('ultimo_acesso', { ascending: false, nullsFirst: false });

        if (error) throw error;

        // Processar dados para adicionar informações úteis
        const usuariosComInfo = data.map(usuario => {
            const ultimoAcesso = usuario.ultimo_acesso ? new Date(usuario.ultimo_acesso) : null;
            const agora = new Date();
            
            let statusAcesso = 'Nunca acessou';
            let diasSemAcessar = null;
            
            if (ultimoAcesso) {
                const diffMs = agora - ultimoAcesso;
                const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                diasSemAcessar = diffDias;
                
                if (diffDias === 0) {
                    statusAcesso = 'Ativo hoje';
                } else if (diffDias === 1) {
                    statusAcesso = 'Acessou ontem';
                } else if (diffDias <= 7) {
                    statusAcesso = `Acessou há ${diffDias} dias`;
                } else if (diffDias <= 30) {
                    statusAcesso = `Inativo há ${diffDias} dias`;
                } else {
                    statusAcesso = `Inativo há mais de ${Math.floor(diffDias / 30)} mês(es)`;
                }
            }
            
            return {
                ...usuario,
                status_acesso: statusAcesso,
                dias_sem_acessar: diasSemAcessar
            };
        });

        res.json({
            sucesso: true,
            quantidade: data.length,
            usuarios: usuariosComInfo
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar estatísticas de acesso',
            erro: error.message
        });
    }
});

export default router;