import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

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
            })
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
            }])
            .select('id, nome_completo, email, nivel_permissao, ativo');
        
        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem:'Usuário cadastrado com sucesso!',
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

export default router;


// Rota POST - Login de usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email e senha são obrigatórios'
            });
        }

        // Buscar usuário pelo email
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Email ou senha incorretos'
            });
        }

        // Verificar se usuário está ativo
        if (!usuario.ativo) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário inativo. Entre em contato com o administrador.'
            });
        }

        // Comparar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Email ou senha incorretos'
            });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email,
                nivel_permissao: usuario.nivel_permissao 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Em quantas horas o token vai expirar.
        );

        res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                nivel_permissao: usuario.nivel_permissao
            }
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao realizar login',
            erro: error.message
        });
    }
});