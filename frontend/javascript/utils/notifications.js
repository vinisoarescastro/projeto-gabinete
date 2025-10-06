/**
 * Sistema de notificações e mensagens ao usuário
 */

/**
 * Exibe mensagem de sucesso
 * @param {string} mensagem
 */
export function mostrarSucesso(mensagem) {
    alert(`✅ ${mensagem}`);
    // TODO: Substituir por toast notification no futuro
}

/**
 * Exibe mensagem de erro
 * @param {string} mensagem
 */
export function mostrarErro(mensagem) {
    alert(`❌ ${mensagem}`);
    // TODO: Substituir por toast notification no futuro
}

/**
 * Exibe mensagem de informação
 * @param {string} mensagem
 */
export function mostrarInfo(mensagem) {
    alert(`ℹ️ ${mensagem}`);
    // TODO: Substituir por toast notification no futuro
}

/**
 * Desabilita um botão e mostra loading
 * @param {HTMLButtonElement} botao
 * @param {string} textoLoading - Texto durante o loading
 * @returns {Function} Função para restaurar o botão
 */
export function botaoLoading(botao, textoLoading = 'Carregando...') {
    const textoOriginal = botao.textContent;
    const estadoOriginal = botao.disabled;
    
    botao.disabled = true;
    botao.textContent = textoLoading;
    
    // Retorna função para restaurar estado original
    return () => {
        botao.disabled = estadoOriginal;
        botao.textContent = textoOriginal;
    };
}