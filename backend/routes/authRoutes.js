import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota POST - Cadastrar novo usuário
router.post('/register', async (req, res) => {
    try {
        const { nome_completo, email, senha, nivel_permissao } = req.body;

        // Validação básica
        if (!nome_completo || !email || !senha || !nivel_permissao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se o email já existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('email')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email já cadastrado'
            });
        }

        // Gerar Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir usuário no Banco de Dados
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nome_completo,
                email,
                senha_hash: senhaHash,
                nivel_permissao,
                ativo: true,
                senha_temporaria: true
            }])
            .select('id, nome_completo, email, nivel_permissao, ativo');
        
        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: data[0]
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cadastrar o usuário',
            erro: error.message
        });
    }
});

// Rota POST - Login de usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email e senha são obrigatórios',
                tipo: 'validacao'
            });
        }

        // Buscar usuário pelo email
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email);

        // ✅ CORREÇÃO: Verificar se o array está vazio (usuário não existe)
        if (error || !usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado',
                descricao: 'Não existe nenhum cadastro com este email. Verifique se digitou corretamente ou entre em contato com o administrador.',
                tipo: 'usuario_nao_encontrado'
            });
        }

        // Pegar o primeiro (e único) usuário encontrado
        const usuario = usuarios[0];

        // ✅ ERRO 2: Usuário inativo (cadastro desativado)
        if (!usuario.ativo) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Conta desativada',
                descricao: 'Sua conta foi desativada. Entre em contato com o Gabinete Digital para mais informações.',
                contato: 'Telefone: (62) XXXX-XXXX | Email: contato@gabinete.com',
                tipo: 'conta_desativada'
            });
        }

        // Comparar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        // ✅ ERRO 3: Senha incorreta
        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha incorreta',
                descricao: 'A senha digitada está incorreta. Verifique se digitou corretamente ou entre em contato com o administrador para resetar sua senha.',
                tipo: 'senha_incorreta'
            });
        }

        // ✅ LOGIN BEM-SUCEDIDO
        // Atualizar último acesso do usuário
        await supabase
            .from('usuarios')
            .update({ ultimo_acesso: new Date().toISOString() })
            .eq('id', usuario.id);

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email,
                nivel_permissao: usuario.nivel_permissao 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                nivel_permissao: usuario.nivel_permissao,
                ultimo_acesso: new Date().toISOString(),
                senha_temporaria: usuario.senha_temporaria
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno no servidor',
            descricao: 'Ocorreu um erro ao processar seu login. Tente novamente em alguns instantes.',
            tipo: 'erro_servidor'
        });
    }
});

// Rota POST - Alterar senha do próprio usuário
router.post('/alterar-senha', verificarToken, async (req, res) => {
    try {
        const { senha_atual, senha_nova } = req.body;
        const usuarioId = req.usuario.id;

        // Validação básica
        if (!senha_atual || !senha_nova) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Senha atual e nova senha são obrigatórias'
            });
        }

        // Validar senha forte
        if (senha_nova.length < 8) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A nova senha deve ter no mínimo 8 caracteres'
            });
        }

        if (!/[A-Z]/.test(senha_nova)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A nova senha deve conter pelo menos uma letra maiúscula'
            });
        }

        if (!/[0-9]/.test(senha_nova)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A nova senha deve conter pelo menos um número'
            });
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha_nova)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A nova senha deve conter pelo menos um caractere especial'
            });
        }

        // Buscar usuário
        const { data: usuario, error: erroUsuario } = await supabase
            .from('usuarios')
            .select('senha_hash')
            .eq('id', usuarioId)
            .single();

        if (erroUsuario || !usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        // Verificar senha atual
        const senhaAtualValida = await bcrypt.compare(senha_atual, usuario.senha_hash);

        if (!senhaAtualValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha atual incorreta'
            });
        }

        // Gerar hash da nova senha
        const novaSenhaHash = await bcrypt.hash(senha_nova, 10);

        // Atualizar senha no banco
        const { error: erroUpdate } = await supabase
            .from('usuarios')
            .update({ 
                senha_hash: novaSenhaHash,
                senha_temporaria: false
            })
            .eq('id', usuarioId);

        if (erroUpdate) throw erroUpdate;

        res.json({
            sucesso: true,
            mensagem: 'Senha alterada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao alterar senha',
            erro: error.message
        });
    }
});

export default router;