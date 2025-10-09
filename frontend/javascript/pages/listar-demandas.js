/**
 * Página de Listagem de Demandas
 */

import { verificarAutenticacao } from '../utils/auth.js';
import { inicializarHeader } from '../components/header.js';
import { listarDemandas } from '../utils/api.js';
import { mostrarCarregando, mostrarErroTabela, renderizarTabela } from '../components/tabela-demandas.js';
import { aplicarFiltros, obterFiltrosAtivos, inicializarFiltros } from '../components/filtros.js';
import { abrirModalDetalhes, inicializarModalDetalhes, adicionarComentario, excluirComentarioModal } from '../components/modal-detalhes.js';
import { abrirModalExclusao, inicializarModalExclusao } from '../components/modal-exclusao.js';
import { abrirModalEdicao, inicializarModalEdicao, fecharModalEdicao } from '../components/modal-edicao.js';
import { abrirModalCadastro, inicializarModalCadastro } from '../components/modal-cadastro-demanda.js';

// Array global com todas as demandas
let todasDemandas = [];

/**
 * Busca demandas do servidor
 */
async function buscarDemandas() {
    mostrarCarregando();
    
    try {
        const data = await listarDemandas();
        
        if (data.sucesso) {
            todasDemandas = data.demandas;
            renderizarDemandasFiltradas();
        } else {
            mostrarErroTabela('Erro ao carregar demandas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErroTabela('Erro ao conectar com o servidor');
    }
}

/**
 * Renderiza demandas aplicando filtros ativos
 */
function renderizarDemandasFiltradas() {
    const filtros = obterFiltrosAtivos();
    const demandasFiltradas = aplicarFiltros(todasDemandas, filtros);
    renderizarTabela(demandasFiltradas);
}

/**
 * Expõe funções globalmente para serem chamadas pelos botões HTML
 */
function exponerFuncoesGlobais() {
    window.visualizarDemanda = abrirModalDetalhes;
    window.confirmarExclusao = (id, titulo) => {
        abrirModalExclusao(id, titulo, buscarDemandas);
    };
    window.abrirModalEdicao = (id) => {
        abrirModalEdicao(id, buscarDemandas);
    };
    window.fecharModalEdicao = fecharModalEdicao;
    window.adicionarComentario = adicionarComentario;
    window.excluirComentarioGlobal = excluirComentarioModal;
}

/**
 * Configura o botão de nova demanda
 */
function configurarBotaoNovaDemanda() {
    const btnNovaDemanda = document.querySelector('.btn.nova-demanda');
    
    if (btnNovaDemanda) {
        // Remover listeners antigos
        const novoBotao = btnNovaDemanda.cloneNode(true);
        btnNovaDemanda.parentNode.replaceChild(novoBotao, btnNovaDemanda);
        
        // Adicionar novo listener
        novoBotao.addEventListener('click', () => {
            console.log('Botão Nova Demanda clicado'); // Debug
            abrirModalCadastro(buscarDemandas);
        });
    } else {
        console.error('Botão Nova Demanda não encontrado');
    }
}

/**
 * Inicializa a página
 */
function inicializar() {
    console.log('Inicializando página Listar Demandas'); // Debug
    
    // Verificar autenticação
    verificarAutenticacao();
    
    // Inicializar header
    inicializarHeader();
    
    // Expor funções globalmente
    exponerFuncoesGlobais();
    
    // Buscar demandas
    buscarDemandas();
    
    // Inicializar filtros
    inicializarFiltros(renderizarDemandasFiltradas);
    
    // Inicializar modais
    inicializarModalDetalhes();
    inicializarModalExclusao();
    inicializarModalEdicao();
    inicializarModalCadastro();
    
    // Configurar botão nova demanda (DEPOIS de inicializar o modal)
    configurarBotaoNovaDemanda();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);