/**
 * Componente de Layout - Menu de Navegação
 * Gera e gerencia o HTML completo do menu de navegação
 * 
 * @module layout-nav
 * @description Este componente cria o menu de navegação completo da aplicação
 * com destaque automático da página atual
 */

/**
 * Define os itens do menu de navegação
 * Centralize aqui todas as rotas do sistema
 */
const ITENS_MENU = [
    {
        nome: 'Inicio',
        url: '/frontend/html/principal.html',
        icone: '' // Opcional: você pode adicionar ícones
    },
    {
        nome: 'Kanban',
        url: '/frontend/html/kanban.html',
        icone: ''
    },
    {
        nome: 'Painel de Demandas',
        url: '/frontend/html/listar-demandas.html',
        icone: ''
    },
    {
        nome: 'Gerenciar Usuários',
        url: '/frontend/html/gerenciar-usuarios.html',
        icone: ''
    },
    {
        nome: 'Eventos e Presença',
        url: '/frontend/html/eventos-presenca.html',
        icone: ''
    }
    // ⬆️ ADICIONE NOVOS ITENS AQUI CONFORME NECESSÁRIO
];

/**
 * Verifica se o item do menu é a página atual
 * @param {string} url - URL do item do menu
 * @returns {boolean} True se for a página atual
 */
function isPaginaAtual(url) {
    const paginaAtual = window.location.pathname;
    return paginaAtual.includes(url);
}

/**
 * Gera o HTML de um item do menu
 * @param {Object} item - Objeto com os dados do item
 * @param {string} item.nome - Nome do item
 * @param {string} item.url - URL do item
 * @param {string} [item.icone] - Ícone opcional do item
 * @returns {string} HTML do item
 */
function gerarHTMLItem(item) {
    const classAtiva = isPaginaAtual(item.url) ? 'ativa' : '';
    
    return `
        <li class="${classAtiva}">
            <a href="${item.url}">
                ${item.icone ? item.icone + ' ' : ''}${item.nome}
            </a>
        </li>
    `;
}

/**
 * Gera o HTML completo do menu de navegação
 * @returns {string} HTML completo do menu
 */
function gerarHTMLNav() {
    // Gera os itens do menu
    const itensHTML = ITENS_MENU
        .map(item => gerarHTMLItem(item))
        .join('');
    
    return `
        <section class="nav">
            <div class="interface">
                <ul class="lista-nav">
                    ${itensHTML}
                </ul>
            </div>
        </section>
    `;
}

/**
 * Injeta o menu de navegação na página
 * @param {string} [containerId='nav-container'] - ID do container onde o menu será injetado
 */
export function renderizarNav(containerId = 'nav-container') {
    // Buscar o container
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container #${containerId} não encontrado!`);
        return;
    }
    
    // Injetar o HTML do menu
    container.innerHTML = gerarHTMLNav();
}

/**
 * Adiciona um novo item ao menu dinamicamente (uso avançado)
 * @param {Object} novoItem - Objeto com os dados do novo item
 * @param {string} novoItem.nome - Nome do item
 * @param {string} novoItem.url - URL do item
 * @param {string} [novoItem.icone] - Ícone opcional do item
 */
export function adicionarItemMenu(novoItem) {
    ITENS_MENU.push(novoItem);
}

/**
 * Remove um item do menu pelo nome (uso avançado)
 * @param {string} nome - Nome do item a ser removido
 */
export function removerItemMenu(nome) {
    const index = ITENS_MENU.findIndex(item => item.nome === nome);
    if (index !== -1) {
        ITENS_MENU.splice(index, 1);
    }
}