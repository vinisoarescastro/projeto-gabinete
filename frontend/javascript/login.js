// URL base da API
const API_URL = 'http://localhost:3000';

// Funcionalidade do formulário de login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Desabilitar botão durante requisição
    const btnLogin = document.querySelector('.login-btn');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';
    
    try {
        // Fazer requisição para API
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });
        
        const data = await response.json();
        
        // Se login foi bem-sucedido
        if (response.ok && data.sucesso) {
            // Salvar token no localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            // Redirecionar para página principal
            window.location.href = '/frontend/html/principal.html';
        } else {
            // Mostrar mensagem de erro
            alert(data.mensagem || 'Email ou senha incorretos!');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar';
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
});

// Efeito de foco suave nos inputs (mantém o que você já tem)
const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.01)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});