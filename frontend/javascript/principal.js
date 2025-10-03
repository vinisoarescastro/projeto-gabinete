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
    window.location.href = '../html/login.html'
}

// Função para buscar estatísticas das demandas
async function buscarEstatisticas() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/demandas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar demandas');
        }

        const data = await response.json();
        
        if (data.sucesso) {
            atualizarDashboard(data.demandas);
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
    }
}

// Função para atualizar os cards do dashboard
function atualizarDashboard(demandas) {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    // Total de demandas
    const totalDemandas = demandas.length;
    
    // Pendentes (status 1, 2, 3 - não concluídas nem arquivadas)
    const pendentes = demandas.filter(d => d.status_id <= 3).length;
    
    // Concluídas (status 4)
    const concluidas = demandas.filter(d => d.status_id === 4).length;
    
    // Arquivadas (status 5)
    const arquivadas = demandas.filter(d => d.status_id === 5).length;
    
    // Suas demandas (do usuário logado)
    const suasDemandas = demandas.filter(d => d.usuario_responsavel_id === usuario.id);
    const suasAFazer = suasDemandas.filter(d => d.status_id === 1).length;
    const suasEmProgresso = suasDemandas.filter(d => d.status_id === 2 || d.status_id === 3).length;
    const suasConcluidas = suasDemandas.filter(d => d.status_id === 4).length;
    
    // Atualizar HTML dos cards
    document.querySelector('.total-demandas h2').textContent = totalDemandas;
    document.querySelector('.pendentes h2').textContent = pendentes;
    document.querySelector('.concluidas h2').textContent = concluidas;
    document.querySelector('.atrasadas h2').textContent = arquivadas;
    
    // Atualizar suas demandas
    document.querySelector('.info.a-fazer p:last-child').textContent = suasAFazer;
    document.querySelector('.info.em-progresso p:last-child').textContent = suasEmProgresso;
    document.querySelector('.info.concluida p:last-child').textContent = suasConcluidas;
}


// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    exibirDadosUsuario();
    buscarEstatisticas(); 
    
    // Adicionar evento ao botão sair
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', logout);
    }

    // Botão acessar kanban
    const btnKanban = document.querySelector('.btn.acessar-kanban');
    if (btnKanban) {
        btnKanban.addEventListener('click', () => {
            window.location.href='../html/kanban.html';
        });
    }
});