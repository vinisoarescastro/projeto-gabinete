/**
 * Rotas da API - Eventos
 * Gerenciamento de eventos políticos do gabinete
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Verifica se usuário tem permissão para gerenciar eventos
 * @param {Object} usuario - Usuário logado
 * @returns {boolean}
 */
function podeGerenciarEventos(usuario) {
    const niveisPermitidos = ['administrador', 'chefe_gabinete', 'supervisor', 'assessor_interno'];
    return niveisPermitidos.includes(usuario.nivel_permissao);
}

// ============================================
// ROTAS GET
// ============================================

/**
 * GET /api/eventos
 * Lista todos os eventos ativos
 */
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select(`
                *,
                usuarios:criado_por (id, nome_completo)
            `)
            .eq('ativo', true)
            .order('data_evento', { ascending: false });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            eventos: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar eventos',
            erro: error.message
        });
    }
});

/**
 * GET /api/eventos/:id
 * Busca um evento específico por ID
 */
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('eventos')
            .select(`
                *,
                usuarios:criado_por (id, nome_completo)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            evento: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar evento',
            erro: error.message
        });
    }
});

/**
 * GET /api/eventos/ultimo/ativo
 * Retorna o último evento cadastrado (para seleção automática)
 */
router.get('/ultimo/ativo', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('ativo', true)
            .order('criado_em', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            sucesso: true,
            evento: data || null
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar último evento',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS POST
// ============================================

/**
 * POST /api/eventos
 * Cria um novo evento
 * Apenas Admin, Chefe de Gabinete e Assessor Interno podem criar
 */
router.post('/', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;

        // Verificar permissão
        if (!podeGerenciarEventos(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para cadastrar eventos'
            });
        }

        const { nome, descricao, data_evento, local } = req.body;

        // Validação
        if (!nome || !data_evento) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome e data do evento são obrigatórios'
            });
        }

        const { data, error } = await supabase
            .from('eventos')
            .insert([{
                nome,
                descricao,
                data_evento,
                local,
                criado_por: usuarioLogado.id
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Evento cadastrado com sucesso!',
            evento: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar evento',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS PUT
// ============================================

/**
 * PUT /api/eventos/:id
 * Atualiza um evento existente
 */
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { id } = req.params;

        // Verificar permissão
        if (!podeGerenciarEventos(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para editar eventos'
            });
        }

        const { nome, descricao, data_evento, local, ativo } = req.body;

        const { data, error } = await supabase
            .from('eventos')
            .update({
                nome,
                descricao,
                data_evento,
                local,
                ativo,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Evento atualizado com sucesso!',
            evento: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar evento',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS DELETE
// ============================================

/**
 * DELETE /api/eventos/:id
 * Desativa um evento (soft delete)
 */
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { id } = req.params;

        // Verificar permissão
        if (!podeGerenciarEventos(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para excluir eventos'
            });
        }

        // Desativa ao invés de deletar
        const { data, error } = await supabase
            .from('eventos')
            .update({ ativo: false })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Evento desativado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir evento',
            erro: error.message
        });
    }
});

export default router;