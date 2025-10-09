/**
 * Página Pública de Visualização de Demanda
 * Salvar em: frontend/javascript/pages/demanda-publica.js
 */

import { buscarDemandaPublica } from '../utils/api.js';
import { formatarData, formatarDataHora } from '../utils/formatters.js';

/**
 * Obtém o token da URL
 * @returns {string|null} Token ou null se não encontrado
 */
function obterTokenDaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

/**
 * Mostra mensagem de erro
 */
function mostrarErro() {
    document.getElementById('loadingDemanda').style.display = 'none';
    document.getElementById('erroDemanda').style.display = 'block';
    document.getElementById('conteudoDemanda').style.display = 'none';
}

/**
 * Renderiza os dados da demanda
 * @param {Object} dados - Dados da demanda
 */
function renderizarDemanda(dados) {
    const demanda = dados.demanda;
    
    // Título
    document.getElementById('demandaTitulo').textContent = demanda.titulo;
    
    // Status
    const badgeStatus = document.getElementById('demandaStatus');
    badgeStatus.textContent = demanda.status_atual.nome;
    badgeStatus.style.backgroundColor = demanda.status_atual.cor || '#6c757d';
    
    // Data
    document.getElementById('demandaData').textContent = formatarData(demanda.criado_em);
    
    // Cidadão
    document.getElementById('demandaCidadao').textContent = demanda.cidadao;
    
    // Descrição
    const descricao = demanda.descricao || 'Sem descrição fornecida.';
    document.getElementById('demandaDescricao').textContent = descricao;
    
    // Timeline de Status
    renderizarTimeline(demanda.historico);
    
    // Comentários
    renderizarComentarios(demanda.comentarios_publicos);
    
    // Mostrar conteúdo
    document.getElementById('loadingDemanda').style.display = 'none';
    document.getElementById('conteudoDemanda').style.display = 'block';
}

/**
 * Renderiza a timeline de status
 * @param {Array} historico - Array com histórico de mudanças
 */
function renderizarTimeline(historico) {
    const container = document.getElementById('timelineStatus');
    
    if (!historico || historico.length === 0) {
        container.innerHTML = `
            <div class="sem-historico">
                <p>Ainda não há histórico de movimentação.</p>
            </div>
        `;
        return;
    }
    
    const html = historico.map(item => `
        <div class="timeline-item">
            <div class="timeline-bullet"></div>
            <div class="timeline-content">
                <div class="timeline-status">${item.status_nome}</div>
                <div class="timeline-data">📅 ${formatarDataHora(item.alterado_em)}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Renderiza os comentários públicos
 * @param {Array} comentarios - Array de comentários
 */
function renderizarComentarios(comentarios) {
    const container = document.getElementById('comentariosPublicos');
    
    if (!comentarios || comentarios.length === 0) {
        container.innerHTML = `
            <div class="sem-comentarios-publico">
                <p>📭 Ainda não há atualizações públicas nesta demanda.</p>
            </div>
        `;
        return;
    }
    
    const html = comentarios.map(comentario => `
        <div class="comentario-item-publico">
            <div class="comentario-data-publico">
                📅 ${formatarDataHora(comentario.criado_em)}
            </div>
            <div class="comentario-texto-publico">
                ${comentario.comentario}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Carrega os dados da demanda
 */
async function carregarDemanda() {
    const token = obterTokenDaURL();
    
    // Verificar se tem token
    if (!token) {
        mostrarErro();
        return;
    }
    
    try {
        const resposta = await buscarDemandaPublica(token);
        
        if (resposta.sucesso) {
            renderizarDemanda(resposta);
        } else {
            mostrarErro();
        }
        
    } catch (error) {
        console.error('Erro ao carregar demanda:', error);
        mostrarErro();
    }
}

/**
 * Inicializa a página
 */
function inicializar() {
    carregarDemanda();
    
    // Atualizar a cada 30 segundos (para mostrar novos comentários/status)
    setInterval(carregarDemanda, 30000);
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);