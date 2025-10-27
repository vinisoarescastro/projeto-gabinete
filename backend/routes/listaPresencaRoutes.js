/**
 * Rotas da API - Lista de Presença
 * Gerenciamento de presenças nos eventos políticos
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Verifica se usuário tem permissão para visualizar lista completa
 * @param {Object} usuario - Usuário logado
 * @returns {boolean}
 */
function podeVisualizarLista(usuario) {
    const niveisPermitidos = ['administrador', 'chefe_gabinete', 'supervisor', 'assessor_interno'];
    return niveisPermitidos.includes(usuario.nivel_permissao);
}

// ============================================
// ROTAS GET
// ============================================

/**
 * GET /api/lista-presenca
 * Lista todas as presenças (com filtros opcionais)
 * Apenas usuários com permissão podem visualizar
 */
router.get('/', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;

        // Verificar permissão
        if (!podeVisualizarLista(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para visualizar a lista de presença'
            });
        }

        const { evento_id } = req.query;

        let query = supabase
            .from('lista_presenca')
            .select(`
                *,
                eventos (id, nome, data_evento),
                usuarios:criado_por (id, nome_completo)
            `)
            .order('criado_em', { ascending: false });

        // Filtrar por evento se especificado
        if (evento_id) {
            query = query.eq('evento_id', evento_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            presencas: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar lista de presença',
            erro: error.message
        });
    }
});

/**
 * GET /api/lista-presenca/evento/:evento_id
 * Lista presenças de um evento específico
 */
router.get('/evento/:evento_id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { evento_id } = req.params;

        // Verificar permissão
        if (!podeVisualizarLista(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para visualizar a lista de presença'
            });
        }

        const { data, error } = await supabase
            .from('lista_presenca')
            .select(`
                *,
                usuarios:criado_por (id, nome_completo)
            `)
            .eq('evento_id', evento_id)
            .order('criado_em', { ascending: false });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            presencas: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar presenças do evento',
            erro: error.message
        });
    }
});

/**
 * GET /api/lista-presenca/buscar-telefone/:telefone
 * Busca dados de uma pessoa pelo telefone (tanto na lista quanto em cidadãos)
 * Retorna dados se encontrar em qualquer das tabelas
 */
router.get('/buscar-telefone/:telefone', verificarToken, async (req, res) => {
    try {
        const { telefone } = req.params;

        // Buscar primeiro na tabela de cidadãos
        const { data: cidadao, error: erroCidadao } = await supabase
            .from('cidadaos')
            .select('nome_completo, telefone, email')
            .eq('telefone', telefone)
            .single();

        if (cidadao) {
            return res.json({
                sucesso: true,
                encontrado: true,
                origem: 'cidadao',
                dados: {
                    nome_completo: cidadao.nome_completo,
                    telefone: cidadao.telefone,
                    email: cidadao.email || ''
                }
            });
        }

        // Se não encontrou em cidadãos, buscar na lista de presença
        const { data: presenca, error: erroPresenca } = await supabase
            .from('lista_presenca')
            .select('nome_completo, telefone, email')
            .eq('telefone', telefone)
            .order('criado_em', { ascending: false })
            .limit(1)
            .single();

        if (presenca) {
            return res.json({
                sucesso: true,
                encontrado: true,
                origem: 'lista_presenca',
                dados: {
                    nome_completo: presenca.nome_completo,
                    telefone: presenca.telefone,
                    email: presenca.email || ''
                }
            });
        }

        // Não encontrou em nenhuma tabela
        res.json({
            sucesso: true,
            encontrado: false,
            dados: null
        });

    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar telefone',
            erro: error.message
        });
    }
});

/**
 * GET /api/lista-presenca/estatisticas/:evento_id
 * Retorna estatísticas de um evento específico
 */
router.get('/estatisticas/:evento_id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { evento_id } = req.params;

        // Verificar permissão
        if (!podeVisualizarLista(usuarioLogado)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para visualizar estatísticas'
            });
        }

        const { data, error } = await supabase
            .from('lista_presenca')
            .select('id, email')
            .eq('evento_id', evento_id);

        if (error) throw error;

        const totalPresencas = data.length;
        const comEmail = data.filter(p => p.email && p.email.trim() !== '').length;
        const semEmail = totalPresencas - comEmail;

        res.json({
            sucesso: true,
            estatisticas: {
                total_presencas: totalPresencas,
                com_email: comEmail,
                sem_email: semEmail,
                percentual_email: totalPresencas > 0 
                    ? ((comEmail / totalPresencas) * 100).toFixed(1) 
                    : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar estatísticas',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS POST
// ============================================

/**
 * POST /api/lista-presenca
 * Registra uma nova presença em um evento
 * Todos os usuários autenticados podem registrar
 */
router.post('/', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { evento_id, nome_completo, telefone, email, observacoes } = req.body;

        // Validação
        if (!evento_id || !nome_completo || !telefone) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Evento, nome completo e telefone são obrigatórios'
            });
        }

        // Verificar se evento existe e está ativo
        const { data: evento, error: erroEvento } = await supabase
            .from('eventos')
            .select('id, ativo')
            .eq('id', evento_id)
            .single();

        if (erroEvento || !evento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        if (!evento.ativo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este evento está desativado'
            });
        }

        // Verificar se a pessoa já está registrada neste evento
        const telefoneLimpo = telefone.replace(/\D/g, '');
        const { data: presencaExistente } = await supabase
            .from('lista_presenca')
            .select('id, nome_completo')
            .eq('evento_id', evento_id)
            .eq('telefone', telefoneLimpo)
            .maybeSingle();

        if (presencaExistente) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `${presencaExistente.nome_completo} já está registrado(a) neste evento`
            });
        }

        // Inserir presença
        const { data, error } = await supabase
            .from('lista_presenca')
            .insert([{
                evento_id,
                nome_completo,
                telefone: telefoneLimpo,
                email: email || null,
                observacoes: observacoes || null,
                criado_por: usuarioLogado.id
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Presença registrada com sucesso!',
            presenca: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao registrar presença',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS PUT
// ============================================

/**
 * PUT /api/lista-presenca/:id
 * Atualiza um registro de presença
 */
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { id } = req.params;
        const { nome_completo, telefone, email, observacoes } = req.body;

        // Buscar presença
        const { data: presencaExistente, error: erroVerificacao } = await supabase
            .from('lista_presenca')
            .select('criado_por')
            .eq('id', id)
            .single();

        if (erroVerificacao || !presencaExistente) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Registro de presença não encontrado'
            });
        }

        // Verificar permissão (quem criou ou quem pode visualizar lista)
        const podeEditar = 
            presencaExistente.criado_por === usuarioLogado.id ||
            podeVisualizarLista(usuarioLogado);

        if (!podeEditar) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para editar este registro'
            });
        }

        const { data, error } = await supabase
            .from('lista_presenca')
            .update({
                nome_completo,
                telefone,
                email: email || null,
                observacoes: observacoes || null,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({
            sucesso: true,
            mensagem: 'Presença atualizada com sucesso!',
            presenca: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar presença',
            erro: error.message
        });
    }
});

// ============================================
// ROTAS DELETE
// ============================================

/**
 * DELETE /api/lista-presenca/:id
 * Exclui um registro de presença
 * Apenas Admin, Chefe de Gabinete e Supervisor podem excluir
 */
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const usuarioLogado = req.usuario;
        const { id } = req.params;

        // Verificar permissão
        const podeExcluir = ['administrador', 'chefe_gabinete', 'supervisor'].includes(
            usuarioLogado.nivel_permissao
        );

        if (!podeExcluir) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para excluir registros de presença'
            });
        }

        const { error } = await supabase
            .from('lista_presenca')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            sucesso: true,
            mensagem: 'Registro de presença excluído com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir presença',
            erro: error.message
        });
    }
});

export default router;