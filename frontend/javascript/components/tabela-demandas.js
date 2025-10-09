/**
 * Componente de Tabela de Demandas
 * Renderiza e gerencia a tabela de listagem
 * 
 * SALVAR EM: frontend/javascript/components/tabela-demandas.js
 */

import { formatarData } from '../utils/formatters.js';
import { getNomeSobrenome } from '../utils/formatters.js';
import { podeEditarDemanda } from '../utils/auth.js';
import { getUsuarioLogado } from '../utils/auth.js';
import { abrirModalCompartilhar } from './modal-compartilhar-demanda.js'; // ⭐ NOVO

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
 * @param {Object} demanda - Dados da demanda
 * @param {Object} handlers - Callbacks para ações
 * @returns {string} HTML da linha
 */
function criarLinhaTabela(demanda, handlers) {
    const usuario = getUsuarioLogado();
    const podeEditar = podeEditarDemanda(demanda, usuario);
    
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
            <td class="acoes-td">
                <div class="acoes-container">
                    ${criarBotoesAcao(demanda, tituloEscapado, podeEditar)}
                </div>
            </td>
        </tr>
    `;
}

/**
 * Cria badge de prioridade
 * @param {string} prioridade - baixa, media, alta
 * @returns {string} HTML do badge
 */
function criarBadgePrioridade(prioridade) {
    return `<span class="badge prioridade-${prioridade}">${prioridade}</span>`;
}

/**
 * Cria badge de status
 * @param {number} statusId - ID do status
 * @param {string} statusNome - Nome do status
 * @returns {string} HTML do badge
 */
function criarBadgeStatus(statusId, statusNome) {
    return `<span class="badge status-${statusId}">${statusNome || 'N/A'}</span>`;
}

/**
 * Cria botões de ação da tabela
 * @param {Object} demanda - Objeto completo da demanda
 * @param {string} tituloEscapado - Título com aspas escapadas
 * @param {boolean} podeEditar - Se o usuário pode editar
 * @returns {string} HTML dos botões
 */
function criarBotoesAcao(demanda, tituloEscapado, podeEditar) {
    // Botão Visualizar (sempre visível)
    const btnVisualizar = `
        <button 
            class="btn-visualizar" 
            onclick="window.visualizarDemanda(${demanda.id})" 
            title="Ver detalhes">
            👁️
        </button>
    `;
    
    // Botão Editar (apenas se tiver permissão)
    const btnEditar = podeEditar ? `
        <button 
            class="btn-editar" 
            onclick="window.editarDemanda(${demanda.id})" 
            title="Editar">
            ✏️
        </button>
    ` : '';
    
    // ⭐ NOVO: Botão Compartilhar (apenas se tiver permissão)
    const btnCompartilhar = podeEditar ? `
        <button 
            class="btn-compartilhar" 
            onclick="window.compartilharDemanda(${demanda.id}, '${tituloEscapado}')"
            title="Compartilhar com cidadão">
            🔗
        </button>
    ` : '';
    
    // Botão Excluir (apenas se tiver permissão)
    const btnExcluir = podeEditar ? `
        <button 
            class="btn-excluir" 
            onclick="window.excluirDemandaModal(${demanda.id}, '${tituloEscapado}')"
            title="Excluir">
            🗑️
        </button>
    ` : '';
    
    // Retorna todos os botões concatenados
    return btnVisualizar + btnEditar + btnCompartilhar + btnExcluir;
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
 * @param {string} mensagem - Mensagem de erro a ser exibida
 */
export function mostrarErroTabela(mensagem = 'Erro ao carregar demandas') {
    const corpoTabela = document.getElementById('corpoTabela');
    if (corpoTabela) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="erro">
                    ❌ ${mensagem}
                </td>
            </tr>
        `;
    }
}

// ============================================
// ⭐ NOVO: Expor funções globalmente para uso no HTML
// ============================================

/**
 * Função global para compartilhar demanda
 * Chamada pelo onclick do botão na tabela
 * @param {number} demandaId - ID da demanda
 * @param {string} titulo - Título da demanda
 */
window.compartilharDemanda = (demandaId, titulo) => {
    console.log('Compartilhando demanda:', demandaId, titulo);
    
    const demanda = { 
        id: demandaId, 
        titulo: titulo 
    };
    
    abrirModalCompartilhar(demanda);
};

/**
 * Nota sobre as outras funções globais:
 * 
 * As funções window.visualizarDemanda, window.editarDemanda e 
 * window.excluirDemandaModal devem estar definidas em outro lugar
 * do seu código (provavelmente em listar-demandas.js)
 * 
 * Se elas não existirem, você verá erros no console quando
 * clicar nesses botões.
 */