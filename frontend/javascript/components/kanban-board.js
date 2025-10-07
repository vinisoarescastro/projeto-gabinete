/**
 * Componente de Board do Kanban
 * Gerencia renderização de colunas e cards
 */

import { criarCard, criarBotaoCarregarMais } from './kanban-card.js';

const CARDS_POR_PAGINA = 8;
let cardsVisiveis = {}; // { status_id: quantidade_visivel }

/**
 * Inicializa contador de cards visíveis
 * @param {Array} todosStatus
 */
export function inicializarContadores(todosStatus) {
    cardsVisiveis = {};
    todosStatus.forEach(status => {
        cardsVisiveis[status.id] = CARDS_POR_PAGINA;
    });
}

/**
 * Renderiza as colunas do kanban
 * @param {Array} todosStatus
 */
export function renderizarColunas(todosStatus) {
    const kanbanBoard = document.getElementById('kanbanBoard');
    
    if (!kanbanBoard) {
        console.error('Elemento kanbanBoard não encontrado');
        return;
    }
    
    kanbanBoard.innerHTML = '';
    
    todosStatus.forEach(status => {
        const coluna = criarColuna(status);
        kanbanBoard.appendChild(coluna);
    });
}

/**
 * Cria uma coluna do kanban
 * @param {Object} status
 * @returns {HTMLElement}
 */
function criarColuna(status) {
    const coluna = document.createElement('div');
    coluna.className = 'kanban-coluna';
    coluna.dataset.status = status.id;
    
    coluna.innerHTML = `
        <div class="coluna-header">
            <h3>${status.nome}</h3>
            <span class="coluna-count" id="count-${status.id}">0</span>
        </div>
        <div class="coluna-cards" id="coluna-${status.id}"></div>
    `;
    
    return coluna;
}

/**
 * Renderiza cards nas colunas
 * @param {Array} demandas
 * @param {Array} todosStatus
 */
export function renderizarCards(demandas, todosStatus) {
    // Limpar todas as colunas
    todosStatus.forEach(status => {
        const coluna = document.getElementById(`coluna-${status.id}`);
        if (coluna) {
            coluna.innerHTML = '';
        }
    });
    
    // Ordenar demandas por prioridade
    const demandasOrdenadas = ordenarPorPrioridade(demandas);
    
    // Agrupar demandas por status
    const demandasPorStatus = agruparPorStatus(demandasOrdenadas, todosStatus);
    
    // Renderizar cards visíveis em cada coluna
    todosStatus.forEach(status => {
        renderizarCardsColuna(status, demandasPorStatus[status.id] || []);
    });
    
    // Atualizar contadores
    atualizarContadores(demandasPorStatus, todosStatus);
}

/**
 * Ordena demandas por prioridade
 * @param {Array} demandas
 * @returns {Array}
 */
function ordenarPorPrioridade(demandas) {
    const pesos = {
        'urgente': 1,
        'alta': 2,
        'media': 3,
        'baixa': 4
    };
    
    return [...demandas].sort((a, b) => {
        return (pesos[a.prioridade] || 5) - (pesos[b.prioridade] || 5);
    });
}

/**
 * Agrupa demandas por status
 * @param {Array} demandas
 * @param {Array} todosStatus
 * @returns {Object}
 */
function agruparPorStatus(demandas, todosStatus) {
    const grupos = {};
    
    todosStatus.forEach(status => {
        grupos[status.id] = demandas.filter(d => d.status_id === status.id);
    });
    
    return grupos;
}

/**
 * Renderiza cards de uma coluna específica
 * @param {Object} status
 * @param {Array} demandasDaColuna
 */
function renderizarCardsColuna(status, demandasDaColuna) {
    const coluna = document.getElementById(`coluna-${status.id}`);
    if (!coluna) return;
    
    const quantidadeVisivel = cardsVisiveis[status.id] || CARDS_POR_PAGINA;
    const demandasVisiveis = demandasDaColuna.slice(0, quantidadeVisivel);
    
    // Renderizar cards visíveis
    demandasVisiveis.forEach(demanda => {
        const card = criarCard(demanda);
        coluna.appendChild(card);
    });
    
    // Adicionar botão "Carregar mais" se necessário
    if (demandasDaColuna.length > quantidadeVisivel) {
        const btnCarregarMais = criarBotaoCarregarMais(
            status.id,
            demandasDaColuna.length - quantidadeVisivel
        );
        coluna.appendChild(btnCarregarMais);
    }
}

/**
 * Atualiza contadores das colunas
 * @param {Object} demandasPorStatus
 * @param {Array} todosStatus
 */
function atualizarContadores(demandasPorStatus, todosStatus) {
    todosStatus.forEach(status => {
        const count = document.getElementById(`count-${status.id}`);
        if (count) {
            const totalDemandas = (demandasPorStatus[status.id] || []).length;
            count.textContent = totalDemandas;
        }
    });
}

/**
 * Carrega mais cards em uma coluna
 * @param {number} statusId
 */
export function carregarMaisCards(statusId) {
    cardsVisiveis[statusId] = (cardsVisiveis[statusId] || CARDS_POR_PAGINA) + CARDS_POR_PAGINA;
}

/**
 * Obtém quantidade de cards visíveis
 * @returns {Object}
 */
export function obterCardsVisiveis() {
    return { ...cardsVisiveis };
}

/**
 * Reseta contadores de cards visíveis
 * @param {Array} todosStatus
 */
export function resetarContadores(todosStatus) {
    inicializarContadores(todosStatus);
}