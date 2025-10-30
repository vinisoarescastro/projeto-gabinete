/**
 * Componente de Layout - Header
 * Gera e gerencia o HTML completo do cabeçalho
 * 
 * @module layout-header
 * @description Este componente cria o header completo da aplicação e preenche
 * automaticamente com os dados do usuário logado
 */

import { getUsuarioLogado, logout } from '../utils/auth.js';
import { capitalizar, getNomeSobrenome, obterIniciais } from '../utils/formatters.js';
import { CORES_AVATAR } from '../utils/constants.js';

/**
 * Gera o HTML do header
 * @returns {string} HTML completo do header
 */
function gerarHTMLHeader() {
    return `
        <header id="header" class="header">
            <div class="interface">
                <section class="logo">
                    <img src="/frontend/img/gabinete-digital/logo-gabinete-digital.png" alt="Logo Gabinete Digital">
                </section>

                <section class="container-usuario">
                    <div class="card-usuario">
                        <div class="img-usuario">
                            <div class="avatar-iniciais" id="avatarUsuario"></div>
                        </div>

                        <div class="txt-usuario">
                            <p>Seja bem-vindo,</p>
                            <h3>Nome Completo</h3>
                            <p>Função do Usuario</p>
                        </div>
                    </div>
                    
                    <div class="btn-sair">
                        <p>Sair</p>
                    </div>
                </section>
            </div>
        </header>
    `;
}

/**
 * Preenche o header com dados do usuário logado
 */
function preencherDadosUsuario() {
    const usuario = getUsuarioLogado();
    
    if (!usuario) {
        console.warn('Nenhum usuário logado encontrado');
        return;
    }
    
    // Atualizar nome do usuário
    const h3Nome = document.querySelector('.txt-usuario h3');
    if (h3Nome) {
        h3Nome.textContent = getNomeSobrenome(usuario.nome_completo);
    }
    
    // Atualizar função/cargo
    const pFuncao = document.querySelector('.txt-usuario p:last-child');
    if (pFuncao) {
        pFuncao.textContent = capitalizar(usuario.nivel_permissao);
    }
    
    // Atualizar avatar com iniciais
    const avatarElement = document.getElementById('avatarUsuario');
    if (avatarElement) {
        const iniciais = obterIniciais(usuario.nome_completo);
        avatarElement.textContent = iniciais;
        
        // Adicionar cor baseada no ID do usuário
        const corIndex = (usuario.id % CORES_AVATAR) + 1;
        avatarElement.classList.add(`cor-${corIndex}`);
    }
}

/**
 * Configura os eventos do header (botão sair, etc)
 */
function configurarEventos() {
    // Configurar botão de sair
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', logout);
    }
}

/**
 * Injeta o header na página e inicializa
 * @param {string} [containerId='header-container'] - ID do container onde o header será injetado
 */
export function renderizarHeader(containerId = 'header-container') {
    // Buscar o container
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container #${containerId} não encontrado!`);
        return;
    }
    
    // Injetar o HTML do header
    container.innerHTML = gerarHTMLHeader();
    
    // Preencher com dados do usuário
    preencherDadosUsuario();
    
    // Configurar eventos
    configurarEventos();
}

/**
 * Função legada para compatibilidade com código existente
 * @deprecated Use renderizarHeader() para criar o header completo
 */
export function inicializarHeader() {
    preencherDadosUsuario();
    configurarEventos();
}