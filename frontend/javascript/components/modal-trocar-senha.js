/**
 * Modal de Troca de Senha Obrigatória
 * Força usuário a trocar senha temporária
 */

import { alterarSenha } from '../utils/api.js';
import { mostrarErro, mostrarSucesso } from '../utils/notifications.js';
import { logout } from '../utils/auth.js';

/**
 * Verifica se precisa trocar senha
 * @param {Object} usuario
 */
export function verificarSenhaTemporaria(usuario) {
    if (usuario.senha_temporaria === true) {
        mostrarModalTrocarSenha();
    }
}

/**
 * Mostra modal de troca de senha
 */
function mostrarModalTrocarSenha() {
    const modal = document.getElementById('modalTrocarSenha');
    if (modal) {
        modal.style.display = 'block';
        
        // Focar no campo de senha atual
        setTimeout(() => {
            document.getElementById('senhaAtualObrigatoria')?.focus();
        }, 300);
    }
}

/**
 * Validar senha forte
 * @param {string} senha
 * @returns {Object}
 */
function validarSenhaForte(senha) {
    const resultado = {
        valida: true,
        mensagens: []
    };
    
    if (senha.length < 8) {
        resultado.valida = false;
        resultado.mensagens.push('Mínimo 8 caracteres');
    }
    
    if (!/[A-Z]/.test(senha)) {
        resultado.valida = false;
        resultado.mensagens.push('Uma letra maiúscula');
    }
    
    if (!/[0-9]/.test(senha)) {
        resultado.valida = false;
        resultado.mensagens.push('Um número');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
        resultado.valida = false;
        resultado.mensagens.push('Um caractere especial');
    }
    
    return resultado;
}

/**
 * Atualizar feedback visual da senha
 */
function atualizarFeedbackSenha() {
    const senhaNova = document.getElementById('senhaNovaObrigatoria').value;
    const senhaConfirm = document.getElementById('senhaConfirmObrigatoria').value;
    const validacaoEl = document.getElementById('validacaoSenha');
    const inputNova = document.getElementById('senhaNovaObrigatoria');
    const inputConfirm = document.getElementById('senhaConfirmObrigatoria');
    const btnTrocar = document.getElementById('btnTrocarSenhaObrigatoria');
    
    // Validar senha nova
    const validacao = validarSenhaForte(senhaNova);
    
    if (senhaNova.length === 0) {
        validacaoEl.textContent = '';
        inputNova.classList.remove('valida', 'invalida');
        btnTrocar.disabled = true;
        return;
    }
    
    if (!validacao.valida) {
        validacaoEl.textContent = '❌ Falta: ' + validacao.mensagens.join(', ');
        validacaoEl.className = 'validacao-senha invalida';
        inputNova.classList.remove('valida');
        inputNova.classList.add('invalida');
        btnTrocar.disabled = true;
    } else {
        validacaoEl.textContent = '✅ Senha forte!';
        validacaoEl.className = 'validacao-senha valida';
        inputNova.classList.remove('invalida');
        inputNova.classList.add('valida');
    }
    
    // Validar confirmação
    if (senhaConfirm.length > 0) {
        if (senhaNova !== senhaConfirm) {
            inputConfirm.classList.add('invalida');
            inputConfirm.classList.remove('valida');
            btnTrocar.disabled = true;
        } else {
            inputConfirm.classList.remove('invalida');
            inputConfirm.classList.add('valida');
            btnTrocar.disabled = !validacao.valida;
        }
    } else {
        inputConfirm.classList.remove('valida', 'invalida');
        btnTrocar.disabled = true;
    }
}

/**
 * Toggle mostrar/ocultar senha
 * @param {string} inputId
 * @param {HTMLElement} button
 */
function toggleSenha(inputId, button) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

/**
 * Processar troca de senha
 */
async function processarTrocaSenha(e) {
    e.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtualObrigatoria').value;
    const senhaNova = document.getElementById('senhaNovaObrigatoria').value;
    const senhaConfirm = document.getElementById('senhaConfirmObrigatoria').value;
    
    // Validações
    if (!senhaAtual || !senhaNova || !senhaConfirm) {
        mostrarErro('Preencha todos os campos');
        return;
    }
    
    if (senhaNova !== senhaConfirm) {
        mostrarErro('As senhas não coincidem');
        return;
    }
    
    const validacao = validarSenhaForte(senhaNova);
    if (!validacao.valida) {
        mostrarErro('Senha não atende aos requisitos: ' + validacao.mensagens.join(', '));
        return;
    }
    
    const btnTrocar = document.getElementById('btnTrocarSenhaObrigatoria');
    const textoOriginal = btnTrocar.textContent;
    btnTrocar.disabled = true;
    btnTrocar.textContent = 'Alterando...';
    
    try {
        const data = await alterarSenha(senhaAtual, senhaNova);
        
        if (data.sucesso) {
            mostrarSucesso('Senha alterada com sucesso! Você será desconectado.');
            
            // Fechar modal e fazer logout
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao alterar senha');
        btnTrocar.disabled = false;
        btnTrocar.textContent = textoOriginal;
    }
}

/**
 * Inicializar modal de troca de senha
 */
export function inicializarModalTrocarSenha() {
    console.log('🔐 Inicializando modal de troca de senha obrigatória');
    
    // Event listeners para validação em tempo real
    const senhaNova = document.getElementById('senhaNovaObrigatoria');
    const senhaConfirm = document.getElementById('senhaConfirmObrigatoria');
    
    if (senhaNova) {
        senhaNova.addEventListener('input', atualizarFeedbackSenha);
        console.log('✅ Listener adicionado ao campo senha nova');
    } else {
        console.warn('⚠️ Campo senhaNovaObrigatoria não encontrado');
    }
    
    if (senhaConfirm) {
        senhaConfirm.addEventListener('input', atualizarFeedbackSenha);
        console.log('✅ Listener adicionado ao campo confirmar senha');
    } else {
        console.warn('⚠️ Campo senhaConfirmObrigatoria não encontrado');
    }
    
    // Toggle senha
    document.querySelectorAll('.toggle-senha').forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.getAttribute('data-target');
            toggleSenha(inputId, this);
        });
    });
    console.log('✅ Toggles de senha configurados');
    
    // Submit form
    const form = document.getElementById('formTrocarSenhaObrigatoria');
    if (form) {
        form.addEventListener('submit', processarTrocaSenha);
        console.log('✅ Submit do formulário configurado');
    } else {
        console.warn('⚠️ Formulário formTrocarSenhaObrigatoria não encontrado');
    }
    
    console.log('✅ Modal de troca de senha inicializado com sucesso');
}

// Expor funções globalmente
window.verificarSenhaTemporaria = verificarSenhaTemporaria;