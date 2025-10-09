/**
 * Componente Modal de Compartilhamento de Demanda
 * Salvar em: frontend/javascript/components/modal-compartilhar-demanda.js
 */

import { 
    gerarLinkCompartilhamento, 
    desativarCompartilhamento, 
    verificarStatusCompartilhamento 
} from '../utils/api.js';
import { mostrarErro, mostrarSucesso } from '../utils/notifications.js';

let demandaAtual = null;
let linkAtual = null;

/**
 * Abre o modal de compartilhamento
 * @param {Object} demanda - Dados da demanda
 */
export async function abrirModalCompartilhar(demanda) {
    demandaAtual = demanda;
    
    const modal = document.getElementById('modalCompartilhar');
    const titulo = document.getElementById('tituloModalCompartilhar');
    
    if (!modal || !titulo) {
        console.error('Modal de compartilhamento não encontrado');
        return;
    }
    
    titulo.textContent = `Compartilhar: ${demanda.titulo}`;
    modal.style.display = 'block';
    
    // Verificar se já está compartilhada
    await verificarStatusAtual();
}

/**
 * Fecha o modal
 */
function fecharModal() {
    const modal = document.getElementById('modalCompartilhar');
    if (modal) {
        modal.style.display = 'none';
    }
    demandaAtual = null;
    linkAtual = null;
}

/**
 * Verifica se a demanda já está compartilhada
 */
async function verificarStatusAtual() {
    const containerStatus = document.getElementById('statusCompartilhamento');
    const btnGerar = document.getElementById('btnGerarLink');
    const btnDesativar = document.getElementById('btnDesativarLink');
    
    try {
        containerStatus.innerHTML = '<p>Verificando...</p>';
        
        const resposta = await verificarStatusCompartilhamento(demandaAtual.id);
        
        if (resposta.compartilhado) {
            // Já está compartilhada
            linkAtual = `${window.location.origin}/frontend/html/demanda-publica.html?token=${resposta.token}`;
            
            containerStatus.innerHTML = `
                <div class="link-ativo">
                    <p class="status-ativo">✅ Link ativo desde ${new Date(resposta.data_compartilhamento).toLocaleString('pt-BR')}</p>
                    <div class="link-container">
                        <input type="text" id="inputLink" value="${linkAtual}" readonly>
                        <button id="btnCopiarLink" class="btn-copiar">📋 Copiar</button>
                    </div>
                    <p class="info-compartilhamento">
                        <small>💡 Compartilhe este link com o cidadão para que ele acompanhe a demanda</small>
                    </p>
                </div>
            `;
            
            btnGerar.style.display = 'none';
            btnDesativar.style.display = 'inline-block';
            
            // Adicionar evento de copiar
            document.getElementById('btnCopiarLink')?.addEventListener('click', copiarLink);
            
        } else {
            // Não está compartilhada
            containerStatus.innerHTML = `
                <div class="sem-link">
                    <p>Esta demanda ainda não foi compartilhada.</p>
                    <p><small>Clique em "Gerar Link" para criar um link de acompanhamento.</small></p>
                </div>
            `;
            
            btnGerar.style.display = 'inline-block';
            btnDesativar.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        containerStatus.innerHTML = `
            <div class="erro-status">
                <p>❌ Erro ao verificar status do compartilhamento</p>
            </div>
        `;
    }
}

/**
 * Gera um novo link de compartilhamento
 */
async function gerarLink() {
    const btnGerar = document.getElementById('btnGerarLink');
    const textoOriginal = btnGerar.textContent;
    
    try {
        btnGerar.textContent = 'Gerando...';
        btnGerar.disabled = true;
        
        const resposta = await gerarLinkCompartilhamento(demandaAtual.id);
        
        if (resposta.sucesso) {
            mostrarSucesso('Link gerado com sucesso!');
            await verificarStatusAtual(); // Atualizar interface
        }
        
    } catch (error) {
        console.error('Erro ao gerar link:', error);
        mostrarErro(error.message || 'Erro ao gerar link de compartilhamento');
        btnGerar.textContent = textoOriginal;
        btnGerar.disabled = false;
    }
}

/**
 * Desativa o compartilhamento
 */
async function desativarLink() {
    if (!confirm('Tem certeza que deseja desativar o compartilhamento? O link atual deixará de funcionar.')) {
        return;
    }
    
    const btnDesativar = document.getElementById('btnDesativarLink');
    const textoOriginal = btnDesativar.textContent;
    
    try {
        btnDesativar.textContent = 'Desativando...';
        btnDesativar.disabled = true;
        
        const resposta = await desativarCompartilhamento(demandaAtual.id);
        
        if (resposta.sucesso) {
            mostrarSucesso('Compartilhamento desativado!');
            await verificarStatusAtual(); // Atualizar interface
        }
        
    } catch (error) {
        console.error('Erro ao desativar:', error);
        mostrarErro(error.message || 'Erro ao desativar compartilhamento');
        btnDesativar.textContent = textoOriginal;
        btnDesativar.disabled = false;
    }
}

/**
 * Copia o link para a área de transferência
 */
async function copiarLink() {
    const input = document.getElementById('inputLink');
    
    try {
        // Selecionar o texto
        input.select();
        input.setSelectionRange(0, 99999); // Para mobile
        
        // Copiar
        await navigator.clipboard.writeText(linkAtual);
        
        // Feedback visual
        const btn = document.getElementById('btnCopiarLink');
        const textoOriginal = btn.textContent;
        btn.textContent = '✅ Copiado!';
        
        setTimeout(() => {
            btn.textContent = textoOriginal;
        }, 2000);
        
        mostrarSucesso('Link copiado para a área de transferência!');
        
    } catch (error) {
        console.error('Erro ao copiar:', error);
        mostrarErro('Erro ao copiar link. Tente copiar manualmente.');
    }
}

/**
 * Inicializa o modal de compartilhamento
 */
export function inicializarModalCompartilhar() {
    // Criar HTML do modal se não existir
    if (!document.getElementById('modalCompartilhar')) {
        criarModalHTML();
    }
    
    // Eventos de fechar
    const modal = document.getElementById('modalCompartilhar');
    const btnFechar = document.querySelector('#modalCompartilhar .close');
    const btnCancelar = document.getElementById('btnCancelarCompartilhar');
    
    if (btnFechar) {
        btnFechar.addEventListener('click', fecharModal);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModal);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
    
    // Botões de ação
    const btnGerar = document.getElementById('btnGerarLink');
    const btnDesativar = document.getElementById('btnDesativarLink');
    
    if (btnGerar) {
        btnGerar.addEventListener('click', gerarLink);
    }
    
    if (btnDesativar) {
        btnDesativar.addEventListener('click', desativarLink);
    }
}

/**
 * Cria o HTML do modal
 */
function criarModalHTML() {
    const modalHTML = `
        <div id="modalCompartilhar" class="modal">
            <div class="modal-content modal-compartilhar">
                <div class="modal-header">
                    <h2 id="tituloModalCompartilhar">Compartilhar Demanda</h2>
                    <span class="close">&times;</span>
                </div>
                
                <div class="modal-body">
                    <div id="statusCompartilhamento">
                        <!-- Conteúdo dinâmico -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" id="btnCancelarCompartilhar" class="btn-cancelar">
                        Fechar
                    </button>
                    <button type="button" id="btnGerarLink" class="btn-gerar" style="display: none;">
                        🔗 Gerar Link
                    </button>
                    <button type="button" id="btnDesativarLink" class="btn-desativar" style="display: none;">
                        🚫 Desativar Link
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}