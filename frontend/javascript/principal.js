// URL base da API
const API_URL = 'http://localhost:3000';

// Função pra verificar se o usuário está logado
function verificarAutenticacao(){

    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    // Se não tem token ou usuario, redireciona para o login
    if (!token || !usuario) {
        window.location.href = '/frontend/html/login.html';
        return null;
    }

    return JSON.parse(usuario)
}

// Função pra exibir os dados do usuário 
function exibirDadosUsuario(){

    const usuario = verificarAutenticacao();

    if (usuario) {
        // capitalizar (primeira letra maiuscula)
        function capitalizar(palavra) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }

        // Atualiza o nome do usuário
        document.querySelector('.txt-usuario h3').textContent = usuario.nome_completo
        document.querySelector('.txt-usuario p:last-child').textContent = capitalizar(usuario.nivel_permissao)
    }
}

// Função Logout
function logout(){
    // Remove os dados do Local Storage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    // Redireciona para o login
    window.location.href = 'frontend/html/login.html'
}


// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    exibirDadosUsuario();

    // Adicionar evento ao botão sair.
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair){
        btnSair.addEventListener('click', logout)
    }
})