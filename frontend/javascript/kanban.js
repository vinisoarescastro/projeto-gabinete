const API_URL = 'http://localhost:3000';
let todasDemandas = [];
let demandaSendoArrastada = null;

// Verificar autenticação
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return null;
    }
    
    return JSON.parse(usuario);
}

// Exibir dados do usuário
function exibirDadosUsuario() {
    const usuario = verificarAutenticacao();
    
    if (usuario) {
        function capitalizar(palavra) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }
        
        document.querySelector('.txt-usuario h3').textContent = usuario.nome_completo;
        document.querySelector('.txt-usuario p:last-child').textContent = capitalizar(usuario.nivel_permissao);
    }
}

// Buscar demandas
async function buscarDemandas() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/demandas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            todasDemandas = data.demandas;
            aplicarFiltroVisualizacao();
        }
    } catch (error) {
        console.error('Erro ao buscar demandas:', error);
        alert('Erro ao carregar demandas');
    }
}

// Aplicar filtro de visualização
function aplicarFiltroVisualizacao() {
    const filtro = document.getElementById('filtroVisualizacao').value;
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    let demandasFiltradas = todasDemandas;
    
    if (filtro === 'minhas') {
        demandasFiltradas = todasDemandas.filter(d => d.usuario_responsavel_id === usuario.id);
    }
    
    renderizarKanban(demandasFiltradas);
}

// Renderizar Kanban
function renderizarKanban(demandas) {
    // Limpar todas as colunas
    for (let i = 1; i <= 5; i++) {
        const coluna = document.getElementById(`coluna-${i}`);
        coluna.innerHTML = '';
    }
    
    // Organizar demandas por status
    demandas.forEach(demanda => {
        const card = criarCard(demanda);
        const coluna = document.getElementById(`coluna-${demanda.status_id}`);
        if (coluna) {
            coluna.appendChild(card);
        }
    });
    
    // Atualizar contadores
    for (let i = 1; i <= 5; i++) {
        const coluna = document.getElementById(`coluna-${i}`);
        const count = document.getElementById(`count-${i}`);
        count.textContent = coluna.children.length;
    }
}

// Criar card
function criarCard(demanda) {
    const card = document.createElement('div');
    card.className = `kanban-card prioridade-${demanda.prioridade}`;
    card.draggable = true;
    card.dataset.id = demanda.id;
    
    // Prévia da descrição (primeiras 80 caracteres)
    const previaDescricao = demanda.descricao 
        ? (demanda.descricao.length > 80 ? demanda.descricao.substring(0, 80) + '...' : demanda.descricao)
        : 'Sem descrição';
    
    card.innerHTML = `
        <div class="card-id">#${demanda.id}</div>
        <div class="card-titulo">${demanda.titulo}</div>
        <span class="card-prioridade ${demanda.prioridade}">${demanda.prioridade}</span>
        <div class="card-cidadao"><strong>Cidadão:</strong> ${demanda.cidadaos?.nome_completo || 'N/A'}</div>
        <div class="card-descricao">${previaDescricao}</div>
        <div class="card-responsavel">${demanda.usuario_responsavel?.nome_completo || 'Sem responsável'}</div>
    `;
    
    // Eventos de drag
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Click para editar
    card.addEventListener('click', () => abrirModalEdicao(demanda.id));
    
    return card;
}

// Drag and Drop
function handleDragStart(e) {
    demandaSendoArrastada = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    if (demandaSendoArrastada) {
        const novoStatusId = parseInt(this.closest('.kanban-coluna').dataset.status);
        const demandaId = parseInt(demandaSendoArrastada.dataset.id);
        
        // Atualizar no backend
        await atualizarStatusDemanda(demandaId, novoStatusId);
    }
    
    return false;
}

// Atualizar status da demanda
async function atualizarStatusDemanda(demandaId, novoStatusId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/demandas/${demandaId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status_id: novoStatusId })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            // Atualizar lista local
            const demanda = todasDemandas.find(d => d.id === demandaId);
            if (demanda) {
                demanda.status_id = novoStatusId;
            }
            
            // Re-renderizar
            aplicarFiltroVisualizacao();
        } else {
            alert('Erro ao atualizar status: ' + data.mensagem);
            aplicarFiltroVisualizacao(); // Reverter
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
        aplicarFiltroVisualizacao(); // Reverter
    }
}

// Inicializar drag and drop
function inicializarDragAndDrop() {
    const colunas = document.querySelectorAll('.coluna-cards');
    
    colunas.forEach(coluna => {
        coluna.addEventListener('dragover', handleDragOver);
        coluna.addEventListener('dragenter', handleDragEnter);
        coluna.addEventListener('dragleave', handleDragLeave);
        coluna.addEventListener('drop', handleDrop);
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    exibirDadosUsuario();
    buscarDemandas();
    inicializarDragAndDrop();
    
    // Botão sair
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', logout);
    }
    
    // Filtro de visualização
    const filtroVisualizacao = document.getElementById('filtroVisualizacao');
    if (filtroVisualizacao) {
        filtroVisualizacao.addEventListener('change', aplicarFiltroVisualizacao);
    }
});