import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota GET - Listar todos os status ativos
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('status')
            .select('*')
            .eq('ativo', true)
            .order('ordem', { ascending: true });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            status: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar status',
            erro: error.message
        });
    }
});

export default router;