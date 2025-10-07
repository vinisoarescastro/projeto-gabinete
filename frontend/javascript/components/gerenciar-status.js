/**
 * Componente de Gerenciamento de Status
 * Modal para criar, editar e excluir colunas do Kanban
 */

import { listarStatus, criarStatus, atualizarStatus, excluirStatus } from '../utils/api.js';
import { mostrarErro, mostrarSucesso, botaoLoading } from '../utils/notifications.js';

let statusEmEdicao = null;
let callbackAposAtualizacao = null;

/**
 * Abre modal de gerenciar status
 * @param {Function} callback - Função a ser executada após criar/editar/excluir
 */
export async function abrirModalStatus(callback) {
    callbackAposAtualizacao = callback;
    await carregarListaStatus();
    mostrarModal();
}

/**
 * Fecha modal
 */
export function fecharModalStatus() {
    const modal = document.getElementById('modalStatus');
    if (modal) {
        modal.style.display = 'none';
    }
    cancelarFormStatus();
}

/**
 * Carrega lista de status
 */
async function carregarListaStatus() {
    const listaStatus = document.getElementById('listaStatus');
    
    if (!listaStatus) return;
    
    try {
        listaStatus.innerHTML = '<p style="text-align: center; color: #6c757d;">Carregando...</p>';
        
        const data = await listarStatus();
        
        if (data.sucesso && data.status.length > 0) {
            listaStatus.innerHTML = data.status.map(s => criarHtmlStatus(s)).join('');
        } else {
            listaStatus.innerHTML = '<p class="sem-status">Nenhum status encontrado</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        listaStatus.innerHTML = '<p style="text-align: center; color: #dc3545;">Erro ao carregar status</p>';
    }
}

/**
 * Cria HTML de um item de status
 * @param {Object} status
 * @returns {string}
 */
function criarHtmlStatus(status) {
    const isProtegido = status.ordem === 1 || status.ordem === 5;
    
    return `
        <div class="status-item ${isProtegido ? 'protegido' : ''}">
            <div class="status-info">
                <div class="status-nome">${status.nome}</div>
                <div class="status-ordem">Ordem: ${status.ordem} ${isProtegido ? '(Protegido)' : ''}</div>
            </div>
            <div class="status-acoes">
                <button 
                    class="btn-status btn-editar-status" 
                    onclick="window.editarStatus(${status.id}, '${status.nome.replace(/'/g, "\\'")}', ${status.ordem})"
                >
                    ✏️ Editar
                </button>
                <button 
                    class="btn-status btn-excluir-status" 
                    onclick="window.confirmarExclusaoStatus(${status.id}, '${status.nome.replace(/'/g, "\\'")})')"
                    ${isProtegido ? 'disabled title="Status protegido não pode ser excluído"' : ''}
                >
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `;
}

/**
 * Mostra formulário de adicionar
 */
export function mostrarFormAdicionar() {
    statusEmEdicao = null;
    document.getElementById('tituloFormStatus').textContent = 'Adicionar Novo Status';
    document.getElementById('nomeStatus').value = '';
    document.getElementById('ordemStatus').value = '';
    document.getElementById('formStatus').classList.add('ativo');
}

/**
 * Edita status
 * @param {number} id
 * @param {string} nome
 * @param {number} ordem
 */
export function editarStatus(id, nome, ordem) {
    statusEmEdicao = id;
    document.getElementById('tituloFormStatus').textContent = 'Editar Status';
    document.getElementById('nomeStatus').value = nome;
    document.getElementById('ordemStatus').value = ordem;
    document.getElementById('formStatus').classList.add('ativo');
}

/**
 * Cancela formulário
 */
export function cancelarFormStatus() {
    statusEmEdicao = null;
    document.getElementById('formStatus').classList.remove('ativo');
    document.getElementById('nomeStatus').value = '';
    document.getElementById('ordemStatus').value = '';
}

/**
 * Salva status (criar ou editar)
 */
export async function salvarStatus(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeStatus').value.trim();
    const ordem = parseInt(document.getElementById('ordemStatus').value) || null;
    
    if (!nome) {
        mostrarErro('Digite um nome para o status');
        return;
    }
    
    const btnSalvar = document.querySelector('.btn-salvar-status');
    const restaurarBotao = botaoLoading(btnSalvar, 'Salvando...');
    
    try {
        let data;
        
        if (statusEmEdicao) {
            // Editar
            data = await atualizarStatus(statusEmEdicao, { nome, ordem });
        } else {
            // Criar novo
            data = await criarStatus({ nome, ordem });
        }
        
        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            cancelarFormStatus();
            await carregarListaStatus();
            
            // Executar callback se fornecido
            if (callbackAposAtualizacao) {
                callbackAposAtualizacao();
            }
        } else {
            mostrarErro('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao salvar status');
        restaurarBotao();
    }
}

/**
 * Confirma exclusão
 * @param {number} id
 * @param {string} nome
 */
export function confirmarExclusaoStatus(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o status "${nome}"?\n\nAtenção: Só é possível excluir status vazios (sem demandas).`)) {
        excluirStatusById(id);
    }
}

/**
 * Exclui status
 * @param {number} id
 */
async function excluirStatusById(id) {
    try {
        const data = await excluirStatus(id);
        
        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            await carregarListaStatus();
            
            // Executar callback se fornecido
            if (callbackAposAtualizacao) {
                callbackAposAtualizacao();
            }
        } else {
            mostrarErro('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao excluir status');
    }
}

/**
 * Mostra o modal
 */
function mostrarModal() {
    const modal = document.getElementById('modalStatus');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Inicializa eventos do modal
 */
export function inicializarModalStatus() {
    console.log('Inicializando modal de gerenciar status');
    
    // Expor funções globalmente
    window.abrirModalStatus = () => abrirModalStatus(null);
    window.fecharModalStatus = fecharModalStatus;
    window.mostrarFormAdicionar = mostrarFormAdicionar;
    window.editarStatus = editarStatus;
    window.cancelarFormStatus = cancelarFormStatus;
    window.confirmarExclusaoStatus = confirmarExclusaoStatus;
    
    // Botão fechar
    const closeStatus = document.querySelector('#modalStatus .close');
    if (closeStatus) {
        closeStatus.addEventListener('click', fecharModalStatus);
    }
    
    // Submit do formulário
    const formStatus = document.getElementById('formStatus');
    if (formStatus) {
        // Remover listener antigo
        const novoForm = formStatus.cloneNode(true);
        formStatus.parentNode.replaceChild(novoForm, formStatus);
        
        // Adicionar novo listener
        novoForm.addEventListener('submit', salvarStatus);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalStatus');
        if (event.target === modal) {
            fecharModalStatus();
        }
    });
    
    console.log('Modal de gerenciar status inicializado');
}