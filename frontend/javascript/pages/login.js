/**
 * Página de Login
 * Responsável por autenticar o usuário no sistema
 */

import { login } from '../utils/api.js';
import { salvarAutenticacao } from '../utils/auth.js';
import { mostrarErro } from '../utils/notifications.js';
import { botaoLoading } from '../utils/notifications.js';

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
            
            // Redirecionar para página principal
            window.location.href = '/frontend/html/principal.html';
        } else {
            // Mostrar mensagem de erro
            mostrarErro(data.mensagem || 'Email ou senha incorretos!');
            restaurarBotao();
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
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