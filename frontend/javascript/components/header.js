/**
 * Componente de Header
 * Gerencia a exibição do cabeçalho com dados do usuário
 */

import { getUsuarioLogado, logout } from '../utils/auth.js';
import { capitalizar, getNomeSobrenome, obterIniciais } from '../utils/formatters.js';
import { CORES_AVATAR } from '../utils/constants.js';

/**
 * Inicializa o header com dados do usuário logado
 */
export function inicializarHeader() {
    const usuario = getUsuarioLogado();
    
    if (!usuario) return;
    
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
    
    // Configurar botão de sair
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', logout);
    }
}