/**
 * Componente de Modal de Edição de Demanda
 */

import { buscarDemanda, atualizarDemanda, listarStatus, listarUsuarios } from '../utils/api.js';
import { mostrarErro, mostrarSucesso, botaoLoading } from '../utils/notifications.js';

let demandaEmEdicao = null;
let callbackAposEditar = null;

/**
 * Abre modal de edição para uma demanda
 * @param {number} id - ID da demanda
 * @param {Function} callback - Função a ser executada após edição bem-sucedida
 */
export async function abrirModalEdicao(id, callback) {
    demandaEmEdicao = id;
    callbackAposEditar = callback;
    
    try {
        // Buscar dados da demanda
        const data = await buscarDemanda(id);
        
        if (data.sucesso) {
            await carregarSelectsEdicao();
            preencherFormularioEdicao(data.demanda);
            mostrarModal();
        } else {
            mostrarErro('Erro ao carregar dados da demanda');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar demanda para edição');
    }
}

/**
 * Carrega os selects do formulário (status e usuários)
 */
async function carregarSelectsEdicao() {
    try {
        // Buscar status
        const statusData = await listarStatus();
        const selectStatus = document.getElementById('edit_status_id');
        
        if (selectStatus && statusData.sucesso) {
            selectStatus.innerHTML = statusData.status.map(s => 
                `<option value="${s.id}">${s.nome}</option>`
            ).join('');
        }

        // Buscar usuários
        const usuariosData = await listarUsuarios();
        const selectUsuarios = document.getElementById('edit_usuario_responsavel_id');
        
        if (selectUsuarios && usuariosData.sucesso) {
            selectUsuarios.innerHTML = usuariosData.usuarios.map(u => 
                `<option value="${u.id}">${u.nome_completo}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

/**
 * Preenche o formulário com dados da demanda
 * @param {Object} demanda
 */
function preencherFormularioEdicao(demanda) {
    document.getElementById('edit_demanda_id').value = demanda.id;
    document.getElementById('edit_titulo').value = demanda.titulo;
    document.getElementById('edit_descricao').value = demanda.descricao || '';
    document.getElementById('edit_prioridade').value = demanda.prioridade;
    
    // Aguardar um pouco para garantir que os selects foram populados
    setTimeout(() => {
        document.getElementById('edit_status_id').value = demanda.status_id;
        document.getElementById('edit_usuario_responsavel_id').value = demanda.usuario_responsavel_id;
    }, 100);
}

/**
 * Salva as edições da demanda
 */
export async function salvarEdicao(e) {
    e.preventDefault();
    
    if (!demandaEmEdicao) return;
    
    const btnSalvar = document.querySelector('#formEditar .btn-salvar');
    const restaurarBotao = botaoLoading(btnSalvar, 'Salvando...');
    
    try {
        const dadosAtualizados = {
            titulo: document.getElementById('edit_titulo').value,
            descricao: document.getElementById('edit_descricao').value,
            prioridade: document.getElementById('edit_prioridade').value,
            usuario_responsavel_id: parseInt(document.getElementById('edit_usuario_responsavel_id').value),
            status_id: parseInt(document.getElementById('edit_status_id').value)
        };
        
        const data = await atualizarDemanda(demandaEmEdicao, dadosAtualizados);
        
        if (data.sucesso) {
            mostrarSucesso('Demanda atualizada com sucesso!');
            fecharModalEdicao();
            
            // Executar callback se fornecido
            if (callbackAposEditar) {
                callbackAposEditar();
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao atualizar demanda');
        restaurarBotao();
    }
}

/**
 * Mostra o modal
 */
function mostrarModal() {
    const modal = document.getElementById('modalEditar');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Fecha o modal
 */
export function fecharModalEdicao() {
    const modal = document.getElementById('modalEditar');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const form = document.getElementById('formEditar');
    if (form) {
        form.reset();
    }
    
    demandaEmEdicao = null;
    callbackAposEditar = null;
}

/**
 * Inicializa eventos do modal de edição
 */
export function inicializarModalEdicao() {
    // Botão fechar
    const closeEditar = document.querySelector('.close-editar');
    if (closeEditar) {
        closeEditar.addEventListener('click', fecharModalEdicao);
    }
    
    // Submit do formulário
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', salvarEdicao);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalEditar');
        if (event.target === modal) {
            fecharModalEdicao();
        }
    });
}