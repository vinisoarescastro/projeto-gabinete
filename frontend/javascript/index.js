/**
 * ============================================
 * SPLASH SCREEN - JAVASCRIPT
 * Sistema de Gestão de Gabinete
 * 
 * Gerencia o tempo de exibição do splash screen
 * e o redirecionamento para a página de login
 * ============================================
 */

/**
 * Configurações do Splash Screen
 * @constant {number} TEMPO_MINIMO_SPLASH - Tempo mínimo de exibição em milissegundos
 * @constant {string} URL_DESTINO - URL para redirecionamento após o splash
 */
const TEMPO_MINIMO_SPLASH = 2500; // 2.5 segundos
const URL_DESTINO = '/frontend/html/login.html';

/**
 * Redireciona para a página de login com animação de saída
 * 
 * Adiciona classe 'fade-out' ao container do splash para criar
 * uma transição suave antes de redirecionar o usuário
 * 
 * @function redirecionarParaLogin
 * @returns {void}
 */
function redirecionarParaLogin() {
    const container = document.querySelector('.splash-container');
    
    // Adiciona classe de fade out para animação suave
    if (container) {
        container.classList.add('fade-out');
    }
    
    // Aguarda a animação terminar antes de redirecionar
    setTimeout(() => {
        window.location.href = URL_DESTINO;
    }, 500); // Tempo da animação CSS (0.5s)
}

/**
 * Inicializa o splash screen quando a página carregar
 * 
 * Aguarda o evento 'load' para garantir que todos os recursos
 * (imagens, fontes, etc) foram carregados antes de iniciar
 * o timer de redirecionamento
 * 
 * @event load
 */
window.addEventListener('load', () => {
    // Garante tempo mínimo de exibição do splash
    setTimeout(redirecionarParaLogin, TEMPO_MINIMO_SPLASH);
});

/**
 * Fallback de segurança
 * 
 * Redireciona após 4 segundos mesmo que o evento 'load' não dispare
 * Evita que o usuário fique preso na tela de splash indefinidamente
 * 
 * @timeout 4000ms
 */
setTimeout(() => {
    // Verifica se ainda está na página do splash
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/') {
        redirecionarParaLogin();
    }
}, 4000);