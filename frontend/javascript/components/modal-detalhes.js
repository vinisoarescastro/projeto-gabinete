/**
 * Componente de Modal de Detalhes da Demanda
 * Exibe informações completas e comentários
 */

import { buscarDemanda, listarComentarios, criarComentario, excluirComentario } from '../utils/api.js';
import { formatarDataHora, formatarTextoComQuebras } from '../utils/formatters.js';
import { podeExcluirComentario } from '../utils/auth.js';
import { mostrarErro, mostrarSucesso } from '../utils/notifications.js';

let demandaAtualId = null;

/**
 * Abre modal de detalhes para uma demanda
 * @param {number} id - ID da demanda
 */
export async function abrirModalDetalhes(id) {
    demandaAtualId = id;
    
    try {
        const data = await buscarDemanda(id);
        
        if (data.sucesso) {
            preencherModalDetalhes(data.demanda);
            await carregarComentarios(id);
            mostrarModal();
        } else {
            mostrarErro('Erro ao carregar detalhes da demanda');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao conectar com o servidor');
    }
}

/**
 * Preenche o modal com dados da demanda
 * @param {Object} demanda
 */
function preencherModalDetalhes(demanda) {
    // Informações gerais
    atualizarElemento('detTitulo', demanda.titulo);
    atualizarElementoHTML('detPrioridade', 
        `<span class="badge prioridade-${demanda.prioridade}">${demanda.prioridade}</span>`
    );
    atualizarElementoHTML('detStatus',
        `<span class="badge status-${demanda.status_id}">${demanda.status?.nome || 'N/A'}</span>`
    );
    atualizarElementoHTML('detDescricao', formatarTextoComQuebras(demanda.descricao));
    
    // Cidadão
    atualizarElemento('detCidadaoNome', demanda.cidadaos?.nome_completo || 'N/A');
    atualizarElemento('detCidadaoTelefone', demanda.cidadaos?.telefone || 'N/A');
    atualizarElemento('detCidadaoCidade', 
        `${demanda.cidadaos?.bairro || 'N/A'}, ${demanda.cidadaos?.cidade || 'N/A'}/${demanda.cidadaos?.estado || 'N/A'}`
    );
    atualizarElemento('detCidadaoEmail', demanda.cidadaos?.email || 'Não informado');
    
    // Responsáveis
    atualizarElemento('detResponsavel', demanda.usuario_responsavel?.nome_completo || 'N/A');
    atualizarElemento('detOrigem', demanda.usuario_origem?.nome_completo || 'N/A');
    atualizarElemento('detDataCriacao', formatarDataHora(demanda.criado_em));
    atualizarElemento('detDataAtualizacao', formatarDataHora(demanda.atualizado_em));
}

/**
 * Atualiza texto de um elemento
 */
function atualizarElemento(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = texto;
    }
}

/**
 * Atualiza HTML de um elemento
 */
function atualizarElementoHTML(id, html) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.innerHTML = html;
    }
}

/**
 * Carrega comentários da demanda
 * @param {number} demandaId
 */
async function carregarComentarios(demandaId) {
    const listaComentarios = document.getElementById('listaComentarios');
    
    if (!listaComentarios) return;
    
    try {
        listaComentarios.innerHTML = '<p class="carregando">Carregando comentários...</p>';
        
        const data = await listarComentarios(demandaId);
        
        if (data.sucesso) {
            if (data.comentarios.length === 0) {
                listaComentarios.innerHTML = '<p class="sem-comentarios">Nenhum comentário ainda</p>';
            } else {
                listaComentarios.innerHTML = data.comentarios.map(comentario =>
                    criarHtmlComentario(comentario)
                ).join('');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        listaComentarios.innerHTML = '<p class="erro">Erro ao carregar comentários</p>';
    }
}

/**
 * Cria HTML de um comentário
 * @param {Object} comentario
 * @returns {string} HTML do comentário
 */
function criarHtmlComentario(comentario) {
    const podeExcluir = podeExcluirComentario(comentario);
    
    const btnExcluir = podeExcluir ? `
        <button 
            class="btn-excluir-comentario" 
            onclick="window.excluirComentarioGlobal(${comentario.id})" 
            title="Excluir comentário"
        >
            🗑️
        </button>
    ` : '';
    
    return `
        <div class="comentario-item">
            <div class="comentario-header">
                <span class="comentario-autor">${comentario.usuarios?.nome_completo || 'Usuário'}</span>
                <div>
                    <span class="comentario-data">${formatarDataHora(comentario.criado_em)}</span>
                    ${btnExcluir}
                </div>
            </div>
            <div class="comentario-texto">${comentario.comentario}</div>
        </div>
    `;
}

/**
 * Adiciona novo comentário
 */
export async function adicionarComentario() {
    const textarea = document.getElementById('novoComentario');
    
    if (!textarea) return;
    
    const comentario = textarea.value.trim();
    
    if (!comentario) {
        mostrarErro('Digite um comentário');
        return;
    }
    
    try {
        const data = await criarComentario(demandaAtualId, comentario);
        
        if (data.sucesso) {
            textarea.value = '';
            await carregarComentarios(demandaAtualId);
            mostrarSucesso('Comentário adicionado!');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao adicionar comentário');
    }
}

/**
 * Exclui um comentário
 * @param {number} id
 */
export async function excluirComentarioModal(id) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }
    
    try {
        const data = await excluirComentario(id);
        
        if (data.sucesso) {
            await carregarComentarios(demandaAtualId);
            mostrarSucesso('Comentário excluído!');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao excluir comentário');
    }
}

/**
 * Mostra o modal
 */
function mostrarModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Fecha o modal
 */
export function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpar textarea
    const textarea = document.getElementById('novoComentario');
    if (textarea) {
        textarea.value = '';
    }
    
    demandaAtualId = null;
}

/**
 * Inicializa eventos do modal
 */
export function inicializarModalDetalhes() {
    // Botão fechar
    const closeDetalhes = document.querySelector('.close-detalhes');
    if (closeDetalhes) {
        closeDetalhes.addEventListener('click', fecharModalDetalhes);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalDetalhes');
        if (event.target === modal) {
            fecharModalDetalhes();
        }
    });
}