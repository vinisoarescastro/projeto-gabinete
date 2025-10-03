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


// Rota DELETE - Excluir comentário
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioLogado = req.usuario;

        // Buscar o comentário
        const { data: comentario, error: erroVerificacao } = await supabase
            .from('comentarios')
            .select('usuario_id')
            .eq('id', id)
            .single();

        if (erroVerificacao || !comentario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Comentário não encontrado'
            });
        }

        // Verificar permissões
        const podeExcluir = 
            usuarioLogado.nivel_permissao === 'administrador' ||
            usuarioLogado.nivel_permissao === 'chefe_gabinete' ||
            comentario.usuario_id === usuarioLogado.id;

        if (!podeExcluir) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para excluir este comentário'
            });
        }

        // Excluir comentário
        const { error } = await supabase
            .from('comentarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            sucesso: true,
            mensagem: 'Comentário excluído com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir comentário',
            erro: error.message
        });
    }
});

export default router;