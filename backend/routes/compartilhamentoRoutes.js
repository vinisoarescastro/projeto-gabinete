/**
 * Rotas de Compartilhamento Público de Demandas
 * Permite gerar links públicos para cidadãos acompanharem suas demandas
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Gera um token único e seguro
 * @returns {string} Token de 32 caracteres
 */
function gerarToken() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Obtém a URL base do frontend
 * @returns {string} URL do frontend
 */
function obterURLFrontend() {
    // URL do frontend hospedado na Vercel
    return process.env.FRONTEND_URL || 'https://projeto-gabinete.vercel.app';
}

/**
 * POST /api/compartilhamento/gerar/:demandaId
 * Gera um link de compartilhamento para uma demanda
 * Requer autenticação
 */
router.post('/gerar/:demandaId', verificarToken, async (req, res) => {
    try {
        const { demandaId } = req.params;
        const usuarioLogado = req.usuario;

        console.log('🔍 [DEBUG] Iniciando geração de link para demanda:', demandaId);

        // 1. Verificar se a demanda existe
        const { data: demanda, error: erroConsulta } = await supabase
            .from('demandas')
            .select('id, titulo, usuario_responsavel_id')
            .eq('id', demandaId)
            .single();

        if (erroConsulta || !demanda) {
            console.log('❌ [DEBUG] Demanda não encontrada:', erroConsulta);
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Demanda não encontrada'
            });
        }

        console.log('✅ [DEBUG] Demanda encontrada:', demanda);

        // 2. Verificar permissão (só responsável, chefe ou admin)
        const podeCompartilhar = 
            usuarioLogado.nivel_permissao === 'administrador' ||
            usuarioLogado.nivel_permissao === 'chefe_gabinete' ||
            demanda.usuario_responsavel_id === usuarioLogado.id;

        if (!podeCompartilhar) {
            console.log('❌ [DEBUG] Usuário sem permissão');
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para compartilhar esta demanda'
            });
        }

        // 3. Gerar token único
        const token = gerarToken();
        console.log('🔑 [DEBUG] Token gerado:', token);

        // 4. Atualizar demanda com o token
        const { data: demandaAtualizada, error: erroAtualizacao } = await supabase
            .from('demandas')
            .update({
                token_compartilhamento: token,
                compartilhamento_ativo: true,
                compartilhado_em: new Date().toISOString(),
                compartilhado_por: usuarioLogado.id
            })
            .eq('id', demandaId)
            .select()
            .single();

        if (erroAtualizacao) {
            console.log('❌ [DEBUG] Erro ao atualizar:', erroAtualizacao);
            throw erroAtualizacao;
        }

        console.log('✅ [DEBUG] Demanda atualizada com sucesso!');
        console.log('📦 [DEBUG] Dados salvos:', {
            token_compartilhamento: demandaAtualizada.token_compartilhamento,
            compartilhamento_ativo: demandaAtualizada.compartilhamento_ativo,
            compartilhado_em: demandaAtualizada.compartilhado_em
        });

        // 5. Gerar link com URL do FRONTEND (Vercel), não do backend
        const urlFrontend = obterURLFrontend();
        const linkGerado = `${urlFrontend}/frontend/html/demanda-publica.html?token=${token}`;
        
        console.log('🔗 [DEBUG] Link gerado:', linkGerado);

        res.json({
            sucesso: true,
            mensagem: 'Link de compartilhamento gerado com sucesso!',
            token: token,
            link: linkGerado,
            demanda: {
                id: demandaAtualizada.id,
                titulo: demandaAtualizada.titulo
            }
        });

    } catch (error) {
        console.error('💥 [DEBUG] Erro ao gerar compartilhamento:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao gerar link de compartilhamento',
            erro: error.message
        });
    }
});

/**
 * DELETE /api/compartilhamento/desativar/:demandaId
 * Desativa o compartilhamento de uma demanda
 * Requer autenticação
 */
router.delete('/desativar/:demandaId', verificarToken, async (req, res) => {
    try {
        const { demandaId } = req.params;
        const usuarioLogado = req.usuario;

        // 1. Buscar demanda
        const { data: demanda, error: erroConsulta } = await supabase
            .from('demandas')
            .select('id, titulo, usuario_responsavel_id, compartilhamento_ativo')
            .eq('id', demandaId)
            .single();

        if (erroConsulta || !demanda) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Demanda não encontrada'
            });
        }

        // 2. Verificar permissão
        const podeDesativar = 
            usuarioLogado.nivel_permissao === 'administrador' ||
            usuarioLogado.nivel_permissao === 'chefe_gabinete' ||
            demanda.usuario_responsavel_id === usuarioLogado.id;

        if (!podeDesativar) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para desativar o compartilhamento desta demanda'
            });
        }

        // 3. Verificar se está ativo
        if (!demanda.compartilhamento_ativo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Esta demanda não está compartilhada'
            });
        }

        // 4. Desativar compartilhamento
        const { error: erroAtualizacao } = await supabase
            .from('demandas')
            .update({
                compartilhamento_ativo: false
            })
            .eq('id', demandaId);

        if (erroAtualizacao) throw erroAtualizacao;

        res.json({
            sucesso: true,
            mensagem: 'Compartilhamento desativado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao desativar compartilhamento:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao desativar compartilhamento',
            erro: error.message
        });
    }
});

/**
 * GET /api/compartilhamento/publico/:token
 * Busca informações públicas de uma demanda pelo token
 * NÃO requer autenticação (rota pública)
 */
router.get('/publico/:token', async (req, res) => {
    try {
        const { token } = req.params;

        console.log('🔍 [DEBUG] Buscando demanda com token:', token);

        // 1. Buscar demanda pelo token
        const { data: demanda, error: erroConsulta } = await supabase
            .from('demandas')
            .select(`
                id,
                titulo,
                descricao,
                criado_em,
                status_id,
                cidadao_id,
                compartilhamento_ativo,
                token_compartilhamento,
                status (id, nome, cor),
                cidadaos (nome_completo)
            `)
            .eq('token_compartilhamento', token)
            .eq('compartilhamento_ativo', true)
            .single();

        if (erroConsulta) {
            console.log('❌ [DEBUG] Erro ao buscar demanda:', erroConsulta);
        }

        if (!demanda) {
            console.log('❌ [DEBUG] Demanda não encontrada ou inativa');
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Link inválido ou expirado'
            });
        }

        console.log('✅ [DEBUG] Demanda encontrada:', {
            id: demanda.id,
            titulo: demanda.titulo,
            compartilhamento_ativo: demanda.compartilhamento_ativo
        });

        // 2. Buscar histórico de status
        const { data: historico, error: erroHistorico } = await supabase
            .from('historico_status')
            .select('status_nome, alterado_em')
            .eq('demanda_id', demanda.id)
            .order('alterado_em', { ascending: true });

        if (erroHistorico) {
            console.error('Erro ao buscar histórico:', erroHistorico);
        }

        // 3. Buscar comentários públicos
        const { data: comentarios, error: erroComentarios } = await supabase
            .from('comentarios')
            .select('comentario, criado_em')
            .eq('demanda_id', demanda.id)
            .eq('publico', true)
            .order('criado_em', { ascending: true });

        if (erroComentarios) {
            console.error('Erro ao buscar comentários:', erroComentarios);
        }

        // 4. Formatar nome do cidadão (apenas nome e sobrenome)
        const nomeCompleto = demanda.cidadaos?.nome_completo || 'Não informado';
        const partesNome = nomeCompleto.trim().split(' ');
        const nomeSobrenome = partesNome.length > 1 
            ? `${partesNome[0]} ${partesNome[partesNome.length - 1]}`
            : partesNome[0];

        // 5. Montar resposta
        res.json({
            sucesso: true,
            demanda: {
                titulo: demanda.titulo,
                descricao: demanda.descricao,
                criado_em: demanda.criado_em,
                status_atual: {
                    nome: demanda.status?.nome || 'Não definido',
                    cor: demanda.status?.cor || '#6c757d'
                },
                cidadao: nomeSobrenome,
                historico: historico || [],
                comentarios_publicos: comentarios || []
            }
        });

    } catch (error) {
        console.error('Erro ao buscar demanda pública:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar informações da demanda',
            erro: error.message
        });
    }
});

/**
 * GET /api/compartilhamento/status/:demandaId
 * Verifica se uma demanda está compartilhada
 * Requer autenticação
 */
router.get('/status/:demandaId', verificarToken, async (req, res) => {
    try {
        const { demandaId } = req.params;

        const { data, error } = await supabase
            .from('demandas')
            .select('compartilhamento_ativo, token_compartilhamento, compartilhado_em')
            .eq('id', demandaId)
            .single();

        if (error) throw error;

        res.json({
            sucesso: true,
            compartilhado: data.compartilhamento_ativo,
            token: data.compartilhamento_ativo ? data.token_compartilhamento : null,
            data_compartilhamento: data.compartilhado_em
        });

    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao verificar status de compartilhamento',
            erro: error.message
        });
    }
});

export default router;