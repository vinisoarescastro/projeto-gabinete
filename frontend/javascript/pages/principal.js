/**
 * Página Principal (Dashboard)
 */

import { verificarAutenticacao, getUsuarioLogado } from '../utils/auth.js';
import { inicializarHeader } from '../components/header.js';
import { listarDemandas } from '../utils/api.js';
import { calcularEstatisticasGerais, calcularEstatisticasUsuario } from '../utils/statistics.js';
import { mostrarErro } from '../utils/notifications.js';
import { abrirModalCadastro, inicializarModalCadastro } from '../components/modal-cadastro-demanda.js';  // ⬅️ NOVO

/**
 * Busca demandas e atualiza dashboard
 */
async function carregarDashboard() {
    try {
        const data = await listarDemandas();
        
        if (data.sucesso) {
            atualizarDashboard(data.demandas);
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        mostrarErro('Erro ao carregar dados do dashboard');
    }
}

/**
 * Atualiza os cards do dashboard com as estatísticas
 */
function atualizarDashboard(demandas) {
    const usuario = getUsuarioLogado();
    
    // Calcular estatísticas gerais
    const stats = calcularEstatisticasGerais(demandas);
    
    // Atualizar cards principais
    atualizarElemento('.total-demandas h2', stats.total);
    atualizarElemento('.pendentes h2', stats.pendentes);
    atualizarElemento('.concluidas h2', stats.concluidas);
    atualizarElemento('.atrasadas h2', stats.arquivadas);
    
    // Calcular estatísticas do usuário logado
    const statsUsuario = calcularEstatisticasUsuario(demandas, usuario.id);
    
    // Atualizar "Suas demandas"
    atualizarElemento('.info.a-fazer p:last-child', statsUsuario.aFazer);
    atualizarElemento('.info.em-progresso p:last-child', statsUsuario.emProgresso);
    atualizarElemento('.info.concluida p:last-child', statsUsuario.concluidas);
}

/**
 * Atualiza o texto de um elemento do DOM
 */
function atualizarElemento(seletor, valor) {
    const elemento = document.querySelector(seletor);
    if (elemento) {
        elemento.textContent = valor;
    }
}

/**
 * Configura os botões de ações rápidas
 */
function configurarBotoesAcoes() {
    // Botão Acessar Kanban
    const btnKanban = document.querySelector('.btn.acessar-kanban');
    if (btnKanban) {
        btnKanban.addEventListener('click', () => {
            window.location.href = '/frontend/html/kanban.html';
        });
    }
    
    // Botão Nova Demanda
    const btnNovaDemanda = document.querySelector('.btn.nova-demanda');
    if (btnNovaDemanda) {
        btnNovaDemanda.addEventListener('click', () => {
            console.log('Botão Nova Demanda clicado'); // Debug
            abrirModalCadastro(carregarDashboard);  // Recarrega dashboard após cadastrar
        });
    }
    
    // Botão Listar Demandas
    const btnListar = document.querySelector('.btn.listar-demandas');
    if (btnListar) {
        btnListar.addEventListener('click', () => {
            window.location.href = '/frontend/html/listar-demandas.html';
        });
    }
    
    // Botão Gerenciar Usuários (funcionalidade futura)
    const btnUsuarios = document.querySelector('.btn.gerenciar-usuarios');
    if (btnUsuarios) {
        btnUsuarios.addEventListener('click', () => {
            alert('Funcionalidade em desenvolvimento');
        });
    }
}

/**
 * Inicializa a página principal
 */
function inicializar() {
    console.log('Inicializando página Principal'); // Debug
    
    // Verificar se está autenticado
    verificarAutenticacao();
    
    // Inicializar header com dados do usuário
    inicializarHeader();
    
    // Carregar dados do dashboard
    carregarDashboard();
    
    // Inicializar modal de cadastro  ⬅️ NOVO
    inicializarModalCadastro();
    
    // Configurar botões
    configurarBotoesAcoes();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);