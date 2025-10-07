/**
 * Página Kanban
 */

import { verificarAutenticacao } from '../utils/auth.js';
import { inicializarHeader } from '../components/header.js';
import { listarDemandas, listarStatus } from '../utils/api.js';
import { mostrarErro } from '../utils/notifications.js';
import { inicializarDragAndDrop } from '../components/drag-drop.js';
import { 
    renderizarColunas, 
    renderizarCards, 
    inicializarContadores,
    carregarMaisCards,
    resetarContadores
} from '../components/kanban-board.js';
import { 
    aplicarFiltroVisualizacao, 
    obterFiltroAtivo, 
    inicializarFiltroKanban 
} from '../components/kanban-filtros.js';
import { abrirModalDetalhes, inicializarModalDetalhes } from '../components/modal-detalhes.js';
import { abrirModalEdicao, inicializarModalEdicao, fecharModalEdicao } from '../components/modal-edicao.js';
import { abrirModalCadastro, inicializarModalCadastro } from '../components/modal-cadastro-demanda.js';
import { abrirModalStatus, inicializarModalStatus } from '../components/gerenciar-status.js';  // ⬅️ NOVO

// Estado global
let todasDemandas = [];
let todosStatus = [];

/**
 * Busca demandas e status do servidor
 */
async function carregarDados() {
    try {
        // Buscar status primeiro
        const statusData = await listarStatus();
        
        if (statusData.sucesso) {
            todosStatus = statusData.status;
            inicializarContadores(todosStatus);
            renderizarColunas(todosStatus);
        }
        
        // Buscar demandas
        const demandasData = await listarDemandas();
        
        if (demandasData.sucesso) {
            todasDemandas = demandasData.demandas;
            aplicarFiltroERenderizar();
        }
        
        // Inicializar drag and drop após renderizar
        setTimeout(() => {
            inicializarDragAndDrop();
        }, 100);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do Kanban');
    }
}

/**
 * Aplica filtro e renderiza o kanban
 */
function aplicarFiltroERenderizar() {
    const filtro = obterFiltroAtivo();
    const demandasFiltradas = aplicarFiltroVisualizacao(todasDemandas, filtro);
    renderizarCards(demandasFiltradas, todosStatus);
    
    // Reinicializar drag and drop após renderizar
    setTimeout(() => {
        inicializarDragAndDrop();
    }, 100);
}

/**
 * Handler para carregar mais cards
 */
function handleCarregarMais(event) {
    const { statusId } = event.detail;
    carregarMaisCards(statusId);
    aplicarFiltroERenderizar();
}

/**
 * Handler para quando uma demanda é movida
 */
function handleDemandaMovida(event) {
    const { demandaId, novoStatusId } = event.detail;
    
    // Atualizar demanda localmente
    const demanda = todasDemandas.find(d => d.id === demandaId);
    if (demanda) {
        demanda.status_id = novoStatusId;
    }
    
    // Re-renderizar
    aplicarFiltroERenderizar();
}

/**
 * Expõe funções globalmente
 */
function exponerFuncoesGlobais() {
    window.visualizarDemanda = abrirModalDetalhes;
    window.abrirModalEdicao = (id) => {
        abrirModalEdicao(id, carregarDados);
    };
    window.fecharModalEdicao = fecharModalEdicao;
}

/**
 * Configura botão de nova demanda
 */
function configurarBotaoNovaDemanda() {
    const btnNovaDemanda = document.querySelector('.btn.nova-demanda');
    
    if (btnNovaDemanda) {
        const novoBotao = btnNovaDemanda.cloneNode(true);
        btnNovaDemanda.parentNode.replaceChild(novoBotao, btnNovaDemanda);
        
        novoBotao.addEventListener('click', () => {
            abrirModalCadastro(carregarDados);
        });
    }
}

/**
 * Configura botão de gerenciar status  ⬅️ ATUALIZADO
 */
function configurarBotaoGerenciarStatus() {
    const btnGerenciar = document.querySelector('.btn.gerenciar-status');
    
    if (btnGerenciar) {
        btnGerenciar.addEventListener('click', () => {
            abrirModalStatus(carregarDados);  // ⬅️ Passa callback para recarregar após mudanças
        });
    }
}

/**
 * Inicializa a página
 */
function inicializar() {
    console.log('Inicializando página Kanban');
    
    // Verificar autenticação
    verificarAutenticacao();
    
    // Inicializar header
    inicializarHeader();
    
    // Expor funções globalmente
    exponerFuncoesGlobais();
    
    // Carregar dados
    carregarDados();
    
    // Inicializar filtros
    inicializarFiltroKanban(aplicarFiltroERenderizar);
    
    // Inicializar modais
    inicializarModalDetalhes();
    inicializarModalEdicao();
    inicializarModalCadastro();
    inicializarModalStatus();  // ⬅️ NOVO
    
    // Configurar botões
    configurarBotaoNovaDemanda();
    configurarBotaoGerenciarStatus();
    
    // Eventos customizados
    window.addEventListener('carregarMaisCards', handleCarregarMais);
    window.addEventListener('demandaMovida', handleDemandaMovida);
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);