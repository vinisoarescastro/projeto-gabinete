import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota GET - Listar todos os cidadãos
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cidadaos')
            .select('id, nome_completo, telefone, cidade, estado')
            .order('nome_completo', { ascending: true });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            cidadaos: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar cidadãos',
            erro: error.message
        });
    }
});

// Rota GET - Buscar cidadão por telefone
router.get('/telefone/:telefone', verificarToken, async (req, res) => {
    try {
        const { telefone } = req.params;
        
        // Remove caracteres não numéricos do telefone
        const telefoneNumeros = telefone.replace(/\D/g, '');

        const { data, error } = await supabase
            .from('cidadaos')
            .select('*')
            .ilike('telefone', `%${telefoneNumeros}%`)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!data) {
            return res.json({
                sucesso: true,
                encontrado: false,
                mensagem: 'Cidadão não encontrado'
            });
        }

        res.json({
            sucesso: true,
            encontrado: true,
            cidadao: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar cidadão',
            erro: error.message
        });
    }
});

// Rota POST - Cadastrar novo cidadão
router.post('/', verificarToken, async (req, res) => {
    try {
        const { nome_completo, telefone, data_nascimento, bairro, cidade, estado, email } = req.body;

        // Validação
        if (!nome_completo || !telefone || !data_nascimento || !bairro || !cidade || !estado) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Campos obrigatórios faltando'
            });
        }

        const { data, error } = await supabase
            .from('cidadaos')
            .insert([{
                nome_completo,
                telefone,
                data_nascimento,
                bairro,
                cidade,
                estado,
                email
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Cidadão cadastrado com sucesso!',
            cidadao: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cadastrar cidadão',
            erro: error.message
        });
    }
});

export default router;