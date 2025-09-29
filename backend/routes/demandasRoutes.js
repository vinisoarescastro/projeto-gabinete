import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Rota GET - Listar todas as demandas
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('demandas')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            demandas: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar demandas',
            erro: error.message
        });
    }
});

export default router;

// Rota POST - Criar nova demanda
router.post('/', async (req, res) => {
    try {
        const { 
            titulo, 
            descricao, 
            prioridade, 
            cidadao_id, 
            usuario_responsavel_id, 
            usuario_origem_id,
            status_id 
        } = req.body;

        // Validação básica
        if (!titulo || !cidadao_id || !usuario_responsavel_id || !usuario_origem_id || !status_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Campos obrigatórios faltando'
            });
        }

        const { data, error } = await supabase
            .from('demandas')
            .insert([{
                titulo,
                descricao,
                prioridade: prioridade || 'media',
                cidadao_id,
                usuario_responsavel_id,
                usuario_origem_id,
                status_id
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Demanda criada com sucesso!',
            demanda: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar demanda',
            erro: error.message
        });
    }
});