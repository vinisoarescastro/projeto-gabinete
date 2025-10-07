/**
 * Componente de Drag and Drop para Kanban
 * Gerencia arraste e solte de cards entre colunas
 */

import { atualizarStatusDemanda } from '../utils/api.js';
import { mostrarErro, mostrarSucesso } from '../utils/notifications.js';

let demandaSendoArrastada = null;
let colunaOrigem = null;

/**
 * Inicializa eventos de drag and drop
 */
export function inicializarDragAndDrop() {
    const colunas = document.querySelectorAll('.coluna-cards');
    
    colunas.forEach(coluna => {
        // Remover listeners antigos
        coluna.removeEventListener('dragover', handleDragOver);
        coluna.removeEventListener('dragenter', handleDragEnter);
        coluna.removeEventListener('dragleave', handleDragLeave);
        coluna.removeEventListener('drop', handleDrop);
        
        // Adicionar novos listeners
        coluna.addEventListener('dragover', handleDragOver);
        coluna.addEventListener('dragenter', handleDragEnter);
        coluna.addEventListener('dragleave', handleDragLeave);
        coluna.addEventListener('drop', handleDrop);
    });
}

/**
 * Handler para início do arraste
 */
export function handleDragStart(e) {
    demandaSendoArrastada = e.currentTarget;
    colunaOrigem = demandaSendoArrastada.closest('.coluna-cards');
    
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    
    // Adicionar classe visual às colunas
    document.querySelectorAll('.coluna-cards').forEach(col => {
        if (col !== colunaOrigem) {
            col.classList.add('drop-zone-active');
        }
    });
}

/**
 * Handler para fim do arraste
 */
export function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    
    // Remover classes visuais
    document.querySelectorAll('.coluna-cards').forEach(col => {
        col.classList.remove('drop-zone-active', 'drag-over');
    });
    
    demandaSendoArrastada = null;
    colunaOrigem = null;
}

/**
 * Handler para arrastar sobre uma área
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handler para entrar em uma área
 */
function handleDragEnter(e) {
    if (demandaSendoArrastada && this !== colunaOrigem) {
        this.classList.add('drag-over');
    }
}

/**
 * Handler para sair de uma área
 */
function handleDragLeave(e) {
    // Verificar se realmente saiu da coluna (não apenas de um filho)
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

/**
 * Handler para soltar na área
 */
async function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    if (demandaSendoArrastada && this !== colunaOrigem) {
        const novoStatusId = parseInt(this.closest('.kanban-coluna').dataset.status);
        const demandaId = parseInt(demandaSendoArrastada.dataset.id);
        
        // Atualizar no backend
        await executarMovimentacao(demandaId, novoStatusId, demandaSendoArrastada, this);
    }
    
    return false;
}

/**
 * Executa a movimentação da demanda
 * @param {number} demandaId
 * @param {number} novoStatusId
 * @param {HTMLElement} cardElement
 * @param {HTMLElement} colunaDestino
 */
async function executarMovimentacao(demandaId, novoStatusId, cardElement, colunaDestino) {
    // Guardar referências para rollback se necessário
    const colunaAnterior = cardElement.parentNode;
    
    try {
        // Mover visualmente primeiro (otimistic update)
        moverCardParaColuna(cardElement, colunaDestino);
        
        // Atualizar no backend
        const data = await atualizarStatusDemanda(demandaId, novoStatusId);
        
        if (data.sucesso) {
            mostrarSucesso('Status atualizado com sucesso!');
            
            // Disparar evento customizado para atualizar contadores
            const evento = new CustomEvent('demandaMovida', {
                detail: { demandaId, novoStatusId }
            });
            window.dispatchEvent(evento);
        } else {
            throw new Error(data.mensagem || 'Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro ao mover demanda:', error);
        mostrarErro('Erro ao atualizar status');
        
        // Rollback: voltar card para coluna original
        moverCardParaColuna(cardElement, colunaAnterior);
    }
}

/**
 * Move card para outra coluna
 * @param {HTMLElement} card
 * @param {HTMLElement} coluna
 */
function moverCardParaColuna(card, coluna) {
    // Remover botão "carregar mais" temporariamente se existir
    const btnCarregarMais = coluna.querySelector('.btn-carregar-mais-container');
    
    if (btnCarregarMais) {
        coluna.insertBefore(card, btnCarregarMais);
    } else {
        coluna.appendChild(card);
    }
    
    // Adicionar animação
    card.style.animation = 'slideIn 0.3s ease-out';
    setTimeout(() => {
        card.style.animation = '';
    }, 300);
}