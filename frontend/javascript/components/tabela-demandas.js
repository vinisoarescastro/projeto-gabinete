/**
 * Componente de Tabela de Demandas
 * Renderiza e gerencia a tabela de listagem
 */

import { formatarData } from '../utils/formatters.js';
import { getNomeSobrenome } from '../utils/formatters.js';
import { podeEditarDemanda } from '../utils/auth.js';
import { getUsuarioLogado } from '../utils/auth.js';

/**
 * Renderiza a tabela de demandas
 * @param {Array} demandas - Array de demandas a serem exibidas
 * @param {Object} handlers - Objeto com funções de callback
 */
export function renderizarTabela(demandas, handlers = {}) {
    const corpoTabela = document.getElementById('corpoTabela');
    
    if (!corpoTabela) {
        console.error('Elemento corpoTabela não encontrado');
        return;
    }
    
    // Tabela vazia
    if (demandas.length === 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="sem-resultados">
                    Nenhuma demanda encontrada com os filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }
    
    // Renderizar linhas
    corpoTabela.innerHTML = demandas.map(demanda => 
        criarLinhaTabela(demanda, handlers)
    ).join('');
}

/**
 * Cria HTML de uma linha da tabela
 * @param {Object} demanda
 * @param {Object} handlers - Callbacks para ações
 * @returns {string} HTML da linha
 */
function criarLinhaTabela(demanda, handlers) {
    const usuario = getUsuarioLogado();
    const podeEditar = podeEditarDemanda(demanda);
    
    // Escapar aspas no título para evitar problemas no HTML
    const tituloEscapado = demanda.titulo.replace(/'/g, "\\'");
    
    return `
        <tr>
            <td>${demanda.titulo}</td>
            <td>${criarBadgePrioridade(demanda.prioridade)}</td>
            <td>${getNomeSobrenome(demanda.cidadaos?.nome_completo)}</td>
            <td>${getNomeSobrenome(demanda.usuario_responsavel?.nome_completo)}</td>
            <td>${criarBadgeStatus(demanda.status_id, demanda.status?.nome)}</td>
            <td>${formatarData(demanda.criado_em)}</td>
            <td>${formatarData(demanda.atualizado_em)}</td>
            <td class="acoes">
                ${criarBotoesAcao(demanda.id, tituloEscapado, podeEditar)}
            </td>
        </tr>
    `;
}

/**
 * Cria badge de prioridade
 * @param {string} prioridade
 * @returns {string} HTML do badge
 */
function criarBadgePrioridade(prioridade) {
    return `<span class="badge prioridade-${prioridade}">${prioridade}</span>`;
}

/**
 * Cria badge de status
 * @param {number} statusId
 * @param {string} statusNome
 * @returns {string} HTML do badge
 */
function criarBadgeStatus(statusId, statusNome) {
    return `<span class="badge status-${statusId}">${statusNome || 'N/A'}</span>`;
}

/**
 * Cria botões de ação
 * @param {number} id
 * @param {string} titulo
 * @param {boolean} podeEditar
 * @returns {string} HTML dos botões
 */
function criarBotoesAcao(id, titulo, podeEditar) {
    const btnVisualizar = `
        <button 
            class="btn-visualizar" 
            onclick="window.visualizarDemanda(${id})" 
            title="Ver detalhes"
        >
            👁️
        </button>
    `;
    
    const btnEditar = podeEditar ? `
        <button 
            class="btn-editar" 
            onclick="window.abrirModalEdicao(${id})" 
            title="Editar"
        >
            ✏️
        </button>
    ` : '';
    
    const btnExcluir = `
        <button 
            class="btn-excluir-demanda" 
            onclick="window.confirmarExclusao(${id}, '${titulo}')" 
            title="Excluir"
        >
            🗑️
        </button>
    `;
    
    return btnVisualizar + btnEditar + btnExcluir;
}

/**
 * Mostra mensagem de carregamento
 */
export function mostrarCarregando() {
    const corpoTabela = document.getElementById('corpoTabela');
    if (corpoTabela) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="carregando">
                    Carregando demandas...
                </td>
            </tr>
        `;
    }
}

/**
 * Mostra mensagem de erro
 * @param {string} mensagem
 */
export function mostrarErroTabela(mensagem = 'Erro ao carregar demandas') {
    const corpoTabela = document.getElementById('corpoTabela');
    if (corpoTabela) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="erro">
                    ${mensagem}
                </td>
            </tr>
        `;
    }
}