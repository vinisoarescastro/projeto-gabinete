/**
 * Funções relacionadas à autenticação
 */

/**
 * Obtém o token de autenticação armazenado
 * @returns {string|null} Token JWT ou null se não existir
 */
export function getToken() {
    return localStorage.getItem('token');
}

/**
 * Obtém dados do usuário logado
 * @returns {Object|null} Objeto com dados do usuário ou null
 */
export function getUsuarioLogado() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

/**
 * Salva token e dados do usuário no localStorage
 * @param {string} token - Token JWT
 * @param {Object} usuario - Dados do usuário
 */
export function salvarAutenticacao(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

/**
 * Verifica se o usuário está autenticado
 * Se não estiver, redireciona para a página de login
 * @returns {Object|null} Dados do usuário ou null
 */
export function verificarAutenticacao() {
    const token = getToken();
    const usuario = getUsuarioLogado();

    if (!token || !usuario) {
        window.location.href = '/frontend/html/login.html';
        return null;
    }

    return usuario;
}

/**
 * Realiza logout do sistema
 * Remove credenciais e redireciona para login
 */
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/frontend/html/login.html';
}

/**
 * Verifica se usuário tem permissão para editar demanda
 * @param {Object} demanda - Demanda a ser verificada
 * @returns {boolean}
 */
export function podeEditarDemanda(demanda) {
    const usuario = getUsuarioLogado();
    if (!usuario) return false;
    
    return (
        usuario.nivel_permissao === 'administrador' ||
        usuario.nivel_permissao === 'chefe_gabinete' ||
        usuario.nivel_permissao === 'supervisor' ||
        demanda.usuario_responsavel_id === usuario.id
    );
}

/**
 * Verifica se usuário pode excluir comentário
 * @param {Object} comentario - Comentário a ser verificado
 * @returns {boolean}
 */
export function podeExcluirComentario(comentario) {
    const usuario = getUsuarioLogado();
    if (!usuario) return false;
    
    return (
        usuario.nivel_permissao === 'administrador' ||
        usuario.nivel_permissao === 'chefe_gabinete' ||
        comentario.usuario_id === usuario.id
    );
}