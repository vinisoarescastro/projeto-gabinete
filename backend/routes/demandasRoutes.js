import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota GET - Listar todas as demandas
router.get('/', verificarToken, async (req, res) => {
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


// Rota POST - Criar nova demanda
router.post('/', verificarToken, async (req, res) => {
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

// Rota PATCH - Atualizar status da demanda
router.patch('/:id/status', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status_id } = req.body;

        if (!status_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'status_id é obrigatório'
            });
        }

        const { data, error } = await supabase
            .from('demandas')
            .update({ status_id })
            .eq('id', id)
            .select();
        
        if (error) throw error;

        if (data.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Demanda não encontrada'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Status atualizado com sucesso!',
            demanda: data[0]
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar status',
            erro: error.message 
        });
    }
});


// Rota GET - Buscar uma demanda específica por ID
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('demandas')
            .select(`
                *,
                cidadaos (id, nome_completo, telefone, email),
                usuario_responsavel:usuarios!usuario_responsavel_id (id, nome_completo, email),
                usuario_origem:usuarios!usuario_origem_id (id, nome_completo, email),
                status (id, nome, ordem)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Demanda não encontrada'
                });
            }
            throw error;
        }

        res.json({
            sucesso: true,
            demanda: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar demanda',
            erro: error.message
        });
    }
});

export default router;