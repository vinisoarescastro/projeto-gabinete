/**
 * Página de Login
 * Responsável por autenticar o usuário no sistema
 */

import { login } from '../utils/api.js';
import { salvarAutenticacao } from '../utils/auth.js';
import { botaoLoading } from '../utils/notifications.js';

/**
 * Mostra mensagem de erro customizada
 * @param {string} mensagem - Mensagem principal
 * @param {string} tipo - Tipo de erro
 */
function mostrarErroCustomizado(mensagem, tipo = 'erro') {
    // Remove alerta anterior se existir
    const alertaAnterior = document.querySelector('.alerta-login');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }

    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta-login ${tipo}`;
    
    // Define ícone baseado no tipo
    let icone = '❌';
    if (tipo === 'usuario_nao_encontrado') icone = '🔍';
    if (tipo === 'conta_desativada') icone = '🚫';
    if (tipo === 'senha_incorreta') icone = '🔑';
    
    // Monta HTML do alerta (SEM descrição)
    alerta.innerHTML = `
        <div class="alerta-header">
            <span class="alerta-icone">${icone}</span>
            <strong>${mensagem}</strong>
        </div>
    `;
    
    // Insere antes do formulário
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(alerta, form);
    
    // Anima entrada
    setTimeout(() => alerta.classList.add('show'), 10);
    
    // Remove após 5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 5000);
}

/**
 * Lida com o submit do formulário de login
 * @param {Event} e - Evento de submit
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // Pegar valores dos campos
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    
    // Botão de login
    const btnLogin = document.querySelector('.login-btn');
    
    // Ativar estado de loading
    const restaurarBotao = botaoLoading(btnLogin, 'Entrando...');
    
    try {
        // Fazer requisição de login
        const data = await login(email, senha);
        
        // Se login foi bem-sucedido
        if (data.sucesso) {
            // Salvar token e dados do usuário
            salvarAutenticacao(data.token, data.usuario);
            
            // Redirecionar IMEDIATAMENTE (sem mensagem de sucesso)
            if (data.usuario.senha_temporaria === true) {
                // Redirecionar para página de troca de senha obrigatória
                window.location.href = '/frontend/html/trocar-senha-obrigatorio.html';
            } else {
                // Redirecionar para página principal
                window.location.href = '/frontend/html/principal.html';
            }
        } else {
            // Mostrar mensagem de erro customizada (SEM descrição)
            mostrarErroCustomizado(
                data.mensagem || 'Erro ao fazer login',
                data.tipo || 'erro'
            );
            restaurarBotao();
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        
        // Tentar pegar mensagem de erro da resposta
        let mensagem = 'Erro ao conectar com o servidor';
        let tipo = 'erro_servidor';
        
        if (error.message) {
            const errorData = error.message;
            
            // Tentar parsear se for JSON
            try {
                const parsed = JSON.parse(errorData);
                mensagem = parsed.mensagem || mensagem;
                tipo = parsed.tipo || tipo;
            } catch {
                mensagem = errorData;
            }
        }
        
        mostrarErroCustomizado(mensagem, tipo);
        restaurarBotao();
    }
}

/**
 * Adiciona efeito visual nos inputs
 */
function inicializarEfeitosVisuais() {
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

/**
 * Inicializa a página de login
 */
function inicializar() {
    // Adicionar listener no formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Inicializar efeitos visuais
    inicializarEfeitosVisuais();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);