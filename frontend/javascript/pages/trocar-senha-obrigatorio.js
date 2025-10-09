/**
 * Página de Troca de Senha Obrigatória
 */

import { verificarAutenticacao, getUsuarioLogado } from '../utils/auth.js';
import { inicializarModalTrocarSenha } from '../components/modal-trocar-senha.js';

/**
 * Inicializa a página
 */
function inicializar() {
    // Verificar se está autenticado
    const usuario = verificarAutenticacao();
    
    // Se não tem senha temporária, redirecionar para principal
    if (usuario.senha_temporaria !== true) {
        window.location.href = '/frontend/html/principal.html';
        return;
    }
    
    // Inicializar modal
    inicializarModalTrocarSenha();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);