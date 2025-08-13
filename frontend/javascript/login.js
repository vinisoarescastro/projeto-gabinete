// Funcionalidade básica do formulário
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
            
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
            
    if (email && password) {
        alert('Login realizado com sucesso!\n\nEste é apenas um exemplo visual.');
    } else {
        alert('Por favor, preencha todos os campos.');
    }
});

// Efeito de foco suave nos inputs
const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.01)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});