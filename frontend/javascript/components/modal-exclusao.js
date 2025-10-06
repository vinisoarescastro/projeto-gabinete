/**
 * Componente de Modal de Confirmação de Exclusão
 */

import { excluirDemanda } from '../utils/api.js';
import { mostrarErro, mostrarSucesso, botaoLoading } from '../utils/notifications.js';

let demandaParaExcluir = null;
let callbackAposExcluir = null;

/**
 * Abre modal de confirmação de exclusão
 * @param {number} id - ID da demanda
 * @param {string} titulo - Título da demanda
 * @param {Function} callback - Função a ser executada após exclusão bem-sucedida
 */
export function abrirModalExclusao(id, titulo, callback) {
    demandaParaExcluir = id;
    callbackAposExcluir = callback;
    
    // Preencher título da demanda
    const elementoTitulo = document.getElementById('tituloDemandaExcluir');
    if (elementoTitulo) {
        elementoTitulo.textContent = titulo;
    }
    
    // Mostrar modal
    const modal = document.getElementById('modalExcluir');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Fecha modal de exclusão
 */
export function fecharModalExclusao() {
    const modal = document.getElementById('modalExcluir');
    if (modal) {
        modal.style.display = 'none';
    }
    
    demandaParaExcluir = null;
    callbackAposExcluir = null;
}

/**
 * Executa a exclusão da demanda
 */
export async function executarExclusao() {
    if (!demandaParaExcluir) return;
    
    const btnExcluir = document.getElementById('btnConfirmarExclusao');
    const restaurarBotao = botaoLoading(btnExcluir, 'Excluindo...');
    
    try {
        const data = await excluirDemanda(demandaParaExcluir);
        
        if (data.sucesso) {
            mostrarSucesso('Demanda excluída com sucesso!');
            fecharModalExclusao();
            
            // Executar callback se fornecido
            if (callbackAposExcluir) {
                callbackAposExcluir();
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao excluir demanda');
        restaurarBotao();
    }
}

/**
 * Inicializa eventos do modal de exclusão
 */
export function inicializarModalExclusao() {
    // Botão fechar
    const closeExcluir = document.querySelector('.close-excluir');
    if (closeExcluir) {
        closeExcluir.addEventListener('click', fecharModalExclusao);
    }
    
    // Botão cancelar
    const btnCancelar = document.getElementById('btnCancelarExclusao');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModalExclusao);
    }
    
    // Botão confirmar
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', executarExclusao);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalExcluir');
        if (event.target === modal) {
            fecharModalExclusao();
        }
    });
}