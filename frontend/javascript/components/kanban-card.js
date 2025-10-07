/**
 * Componente de Card do Kanban
 * Cria e gerencia os cards individuais
 */

import { handleDragStart, handleDragEnd } from './drag-drop.js';
import { getNomeSobrenome } from '../utils/formatters.js';

/**
 * Cria um card de demanda
 * @param {Object} demanda
 * @returns {HTMLElement}
 */
export function criarCard(demanda) {
    const card = document.createElement('div');
    card.className = `kanban-card prioridade-${demanda.prioridade}`;
    card.draggable = true;
    card.dataset.id = demanda.id;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-id">#${demanda.id}</div>
            <span class="card-prioridade ${demanda.prioridade}">${demanda.prioridade}</span>
        </div>
        <div class="card-titulo">${demanda.titulo}</div>
        <div class="card-cidadao"><strong>Cidadão:</strong> ${getNomeSobrenome(demanda.cidadaos?.nome_completo)}</div>
        <div class="card-responsavel">${getNomeSobrenome(demanda.usuario_responsavel?.nome_completo) || 'Sem responsável'}</div>
    `;
    
    // Eventos de drag
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Click para ver detalhes
    card.addEventListener('click', () => {
        if (window.visualizarDemanda) {
            window.visualizarDemanda(demanda.id);
        }
    });
    
    return card;
}

/**
 * Cria botão "Carregar mais"
 * @param {number} statusId
 * @param {number} quantidadeRestante
 * @returns {HTMLElement}
 */
export function criarBotaoCarregarMais(statusId, quantidadeRestante) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-carregar-mais-container';
    
    const btn = document.createElement('button');
    btn.className = 'btn-carregar-mais';
    btn.textContent = `Carregar mais (${quantidadeRestante})`;
    btn.onclick = () => {
        const evento = new CustomEvent('carregarMaisCards', {
            detail: { statusId }
        });
        window.dispatchEvent(evento);
    };
    
    btnContainer.appendChild(btn);
    return btnContainer;
}