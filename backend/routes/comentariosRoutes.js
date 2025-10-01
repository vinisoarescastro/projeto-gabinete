import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota POST - Criar novo comentário
router.post('/', verificarToken, async (req, res) => {
    try {
        const { demanda_id, comentario } = req.body;
        const usuario_id = req.usuario.id; // Pega do token JWT

        // Validação básica
        if (!demanda_id || !comentario) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'demanda_id e comentario são obrigatórios'
            });
        }

        // Verificar se a demanda existe
        const { data: demandaExiste } = await supabase
            .from('demandas')
            .select('id')
            .eq('id', demanda_id)
            .single();

        if (!demandaExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Demanda não encontrada'
            });
        }

        // Criar comentário
        const { data, error } = await supabase
            .from('comentarios')
            .insert([{
                demanda_id,
                usuario_id,
                comentario
            }])
            .select(`
                *,
                usuarios (id, nome_completo, email)
            `);

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Comentário criado com sucesso!',
            comentario: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar comentário',
            erro: error.message
        });
    }
});

// Rota GET - Listar comentários de uma demanda específica
router.get('/demanda/:demanda_id', verificarToken, async (req, res) => {
    try {
        const { demanda_id } = req.params;

        const { data, error } = await supabase
            .from('comentarios')
            .select(`
                *,
                usuarios (id, nome_completo, email)
            `)
            .eq('demanda_id', demanda_id)
            .order('criado_em', { ascending: true });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            comentarios: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar comentários',
            erro: error.message
        });
    }
});

export default router;