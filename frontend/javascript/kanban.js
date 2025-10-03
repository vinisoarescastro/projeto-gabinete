const API_URL = 'http://localhost:3000';
let todasDemandas = [];
let todosStatus = [];
let demandaSendoArrastada = null;

// Controle de paginação por coluna
let cardsVisiveis = {}; // { status_id: quantidade_visivel }
const CARDS_POR_PAGINA = 8;

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
        // Buscar status primeiro
        const statusResponse = await fetch(`${API_URL}/api/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statusData = await statusResponse.json();
        
        if (statusData.sucesso) {
            todosStatus = statusData.status;
            
            // Inicializar contador de cards visíveis para cada status
            cardsVisiveis = {};
            todosStatus.forEach(status => {
                cardsVisiveis[status.id] = CARDS_POR_PAGINA;
            });
            
            renderizarColunas(); // Criar as colunas primeiro
        }
        
        // Buscar demandas
        const response = await fetch(`${API_URL}/api/demandas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            todasDemandas = data.demandas;
            aplicarFiltroVisualizacao(); // Depois renderizar as demandas
        }
    } catch (error) {
        console.error('Erro ao buscar demandas:', error);
        alert('Erro ao carregar demandas');
    }
}

// Renderizar colunas dinamicamente
function renderizarColunas() {
    const kanbanBoard = document.getElementById('kanbanBoard');
    
    if (!kanbanBoard) {
        console.error('Elemento kanbanBoard não encontrado');
        return;
    }
    
    kanbanBoard.innerHTML = '';
    
    todosStatus.forEach(status => {
        const coluna = document.createElement('div');
        coluna.className = 'kanban-coluna';
        coluna.dataset.status = status.id;
        
        coluna.innerHTML = `
            <div class="coluna-header">
                <h3>${status.nome}</h3>
                <span class="coluna-count" id="count-${status.id}">0</span>
            </div>
            <div class="coluna-cards" id="coluna-${status.id}"></div>
        `;
        
        kanbanBoard.appendChild(coluna);
    });
    
    // Reinicializar drag and drop após criar as colunas
    setTimeout(() => {
        inicializarDragAndDrop();
    }, 100);
}

// Pegar apenas primeiro e último nome
function getNomeSobrenome(nomeCompleto) {
    if (!nomeCompleto) return 'N/A';
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

// Obter peso da prioridade para ordenação
function getPesoPrioridade(prioridade) {
    const pesos = {
        'urgente': 1,
        'alta': 2,
        'media': 3,
        'baixa': 4
    };
    return pesos[prioridade] || 5;
}

// Aplicar filtro de visualização
function aplicarFiltroVisualizacao() {
    const filtro = document.getElementById('filtroVisualizacao').value;
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    let demandasFiltradas = todasDemandas;
    
    if (filtro === 'minhas') {
        demandasFiltradas = todasDemandas.filter(d => d.usuario_responsavel_id === usuario.id);
    }
    
    // Só resetar contador de cards visíveis se usuário mudou o filtro
    // (não resetar no carregamento inicial)
    const resetarContadores = Object.keys(cardsVisiveis).length > 0;
    
    if (resetarContadores) {
        cardsVisiveis = {};
        todosStatus.forEach(status => {
            cardsVisiveis[status.id] = CARDS_POR_PAGINA;
        });
    }
    
    renderizarKanban(demandasFiltradas);
}

// Renderizar Kanban
function renderizarKanban(demandas) {
    // Verificar se as colunas foram criadas
    if (todosStatus.length === 0) {
        console.warn('Nenhum status carregado ainda');
        return;
    }
    
    // Limpar todas as colunas
    todosStatus.forEach(status => {
        const coluna = document.getElementById(`coluna-${status.id}`);
        if (coluna) {
            coluna.innerHTML = '';
        }
    });
    
    // Ordenar demandas por prioridade (urgente > alta > media > baixa)
    const demandasOrdenadas = [...demandas].sort((a, b) => {
        return getPesoPrioridade(a.prioridade) - getPesoPrioridade(b.prioridade);
    });
    
    // Agrupar demandas por status
    const demandasPorStatus = {};
    todosStatus.forEach(status => {
        demandasPorStatus[status.id] = demandasOrdenadas.filter(d => d.status_id === status.id);
    });
    
    // Renderizar cards visíveis em cada coluna
    todosStatus.forEach(status => {
        const demandasDaColuna = demandasPorStatus[status.id] || [];
        const quantidadeVisivel = cardsVisiveis[status.id] || CARDS_POR_PAGINA;
        const demandasVisiveis = demandasDaColuna.slice(0, quantidadeVisivel);
        
        // Debug
        console.log(`Status ${status.id}: Total=${demandasDaColuna.length}, Visíveis=${demandasVisiveis.length}, Limite=${quantidadeVisivel}`);
        
        const coluna = document.getElementById(`coluna-${status.id}`);
        if (coluna) {
            // Renderizar cards visíveis
            demandasVisiveis.forEach(demanda => {
                const card = criarCard(demanda);
                coluna.appendChild(card);
            });
            
            // Se houver mais cards para carregar, adicionar botão
            if (demandasDaColuna.length > quantidadeVisivel) {
                const btnCarregarMais = criarBotaoCarregarMais(status.id, demandasDaColuna.length - quantidadeVisivel);
                coluna.appendChild(btnCarregarMais);
            }
        }
    });
    
    // Atualizar contadores (total de demandas, não só visíveis)
    todosStatus.forEach(status => {
        const count = document.getElementById(`count-${status.id}`);
        if (count) {
            const totalDemandas = (demandasPorStatus[status.id] || []).length;
            count.textContent = totalDemandas;
        }
    });
}

// Criar botão "Carregar mais"
function criarBotaoCarregarMais(statusId, quantidadeRestante) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-carregar-mais-container';
    
    const btn = document.createElement('button');
    btn.className = 'btn-carregar-mais';
    btn.textContent = `Carregar mais (${quantidadeRestante})`;
    btn.onclick = () => carregarMaisCards(statusId);
    
    btnContainer.appendChild(btn);
    return btnContainer;
}

// Carregar mais cards em uma coluna específica
function carregarMaisCards(statusId) {
    cardsVisiveis[statusId] = (cardsVisiveis[statusId] || CARDS_POR_PAGINA) + CARDS_POR_PAGINA;
    
    // Re-renderizar apenas aplicando o filtro atual
    const filtro = document.getElementById('filtroVisualizacao').value;
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    let demandasFiltradas = todasDemandas;
    if (filtro === 'minhas') {
        demandasFiltradas = todasDemandas.filter(d => d.usuario_responsavel_id === usuario.id);
    }
    
    renderizarKanban(demandasFiltradas);
}

// Criar card - MODIFICADO: Prioridade ao lado do ID
function criarCard(demanda) {
    const card = document.createElement('div');
    card.className = `kanban-card prioridade-${demanda.prioridade}`;
    card.draggable = true;
    card.dataset.id = demanda.id;
    
    // Nova estrutura: ID e Prioridade lado a lado
    card.innerHTML = `
        <div class="card-header">
            <div class="card-id">#${demanda.id}</div>
            <span class="card-prioridade ${demanda.prioridade}">${demanda.prioridade}</span>
        </div>
        <div class="card-titulo">${demanda.titulo}</div>
        <div class="card-cidadao"><strong>Cidadão:</strong> ${getNomeSobrenome(demanda.cidadaos?.nome_completo)}</div>
        <div class="card-responsavel">${getNomeSobrenome(demanda.usuario_responsavel?.nome_completo) || 'Sem responsável'}</div>
    `;
    
    // Eventos de drag
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Click para ver detalhes - MODIFICADO: Agora chama função para visualizar
    card.addEventListener('click', () => visualizarDemanda(demanda.id));
    
    return card;
}

// NOVA FUNÇÃO: Visualizar detalhes da demanda
async function visualizarDemanda(id) {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    try {
        const response = await fetch(`${API_URL}/api/demandas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            const demanda = data.demanda;
            
            // Preencher modal com dados
            document.getElementById('detTitulo').textContent = demanda.titulo;
            document.getElementById('detPrioridade').innerHTML = `<span class="badge prioridade-${demanda.prioridade}">${demanda.prioridade}</span>`;
            document.getElementById('detStatus').innerHTML = `<span class="badge status-${demanda.status_id}">${demanda.status?.nome || 'N/A'}</span>`;
            document.getElementById('detDescricao').innerHTML = formatarTextoComQuebras(demanda.descricao);
            
            // Cidadão
            document.getElementById('detCidadaoNome').textContent = demanda.cidadaos?.nome_completo || 'N/A';
            document.getElementById('detCidadaoTelefone').textContent = demanda.cidadaos?.telefone || 'N/A';
            document.getElementById('detCidadaoCidade').textContent = `${demanda.cidadaos?.bairro || 'N/A'}, ${demanda.cidadaos?.cidade || 'N/A'}/${demanda.cidadaos?.estado || 'N/A'}`;
            document.getElementById('detCidadaoEmail').textContent = demanda.cidadaos?.email || 'Não informado';
            
            // Responsáveis
            document.getElementById('detResponsavel').textContent = demanda.usuario_responsavel?.nome_completo || 'N/A';
            document.getElementById('detOrigem').textContent = demanda.usuario_origem?.nome_completo || 'N/A';
            document.getElementById('detDataCriacao').textContent = formatarDataHora(demanda.criado_em);
            document.getElementById('detDataAtualizacao').textContent = formatarDataHora(demanda.atualizado_em);
            
            // Verificar se pode editar e mostrar/ocultar botão
            const podeEditar = 
                usuario.nivel_permissao === 'administrador' ||
                usuario.nivel_permissao === 'chefe_gabinete' ||
                usuario.nivel_permissao === 'supervisor' ||
                demanda.usuario_responsavel_id === usuario.id;
            
            const btnEditar = document.getElementById('btnEditarDetalhes');
            if (podeEditar) {
                btnEditar.style.display = 'inline-block';
                btnEditar.onclick = () => abrirModalEdicao(demanda.id);
            } else {
                btnEditar.style.display = 'none';
            }
            
            // Abrir modal
            document.getElementById('modalDetalhes').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes');
    }
}

// Converter quebras de linha em <br>
function formatarTextoComQuebras(texto) {
    if (!texto) return 'Sem descrição';
    return texto.replace(/\n/g, '<br>');
}

// Formatar data com hora
function formatarDataHora(dataISO) {
    const data = new Date(dataISO);
    
    const opcoes = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return data.toLocaleString('pt-BR', opcoes);
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

// Abrir modal de edição
async function abrirModalEdicao(id) {
    const token = localStorage.getItem('token');
    
    try {
        // Fechar modal de detalhes
        document.getElementById('modalDetalhes').style.display = 'none';
        
        // Buscar dados da demanda
        const response = await fetch(`${API_URL}/api/demandas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            const demanda = data.demanda;
            
            // Preencher formulário
            document.getElementById('edit_demanda_id').value = demanda.id;
            document.getElementById('edit_titulo').value = demanda.titulo;
            document.getElementById('edit_descricao').value = demanda.descricao || '';
            document.getElementById('edit_prioridade').value = demanda.prioridade;
            document.getElementById('edit_status_id').value = demanda.status_id;
            document.getElementById('edit_usuario_responsavel_id').value = demanda.usuario_responsavel_id;
            
            // Carregar selects
            await carregarSelectsEdicao();
            
            // Reselecionar valores após carregar
            document.getElementById('edit_status_id').value = demanda.status_id;
            document.getElementById('edit_usuario_responsavel_id').value = demanda.usuario_responsavel_id;
            
            // Abrir modal
            document.getElementById('modalEditar').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados da demanda');
    }
}

// Carregar selects do modal de edição
async function carregarSelectsEdicao() {
    const token = localStorage.getItem('token');
    
    try {
        // Buscar status
        const statusRes = await fetch(`${API_URL}/api/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statusData = await statusRes.json();
        
        const selectStatus = document.getElementById('edit_status_id');
        selectStatus.innerHTML = statusData.status.map(s => 
            `<option value="${s.id}">${s.nome}</option>`
        ).join('');

        // Buscar usuários
        const usuariosRes = await fetch(`${API_URL}/api/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuariosData = await usuariosRes.json();
        
        const selectUsuarios = document.getElementById('edit_usuario_responsavel_id');
        selectUsuarios.innerHTML = usuariosData.usuarios.map(u => 
            `<option value="${u.id}">${u.nome_completo}</option>`
        ).join('');
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

// Fechar modal de edição
function fecharModalEdicao() {
    document.getElementById('modalEditar').style.display = 'none';
    document.getElementById('formEditar').reset();
}

// Salvar edição
async function salvarEdicao(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const id = document.getElementById('edit_demanda_id').value;
    const btnSalvar = document.querySelector('#formEditar .btn-salvar');
    
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    
    try {
        const dadosAtualizados = {
            titulo: document.getElementById('edit_titulo').value,
            descricao: document.getElementById('edit_descricao').value,
            prioridade: document.getElementById('edit_prioridade').value,
            usuario_responsavel_id: parseInt(document.getElementById('edit_usuario_responsavel_id').value),
            status_id: parseInt(document.getElementById('edit_status_id').value)
        };
        
        const response = await fetch(`${API_URL}/api/demandas/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizados)
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert('Demanda atualizada com sucesso!');
            fecharModalEdicao();
            buscarDemandas(); // Recarregar kanban
        } else {
            alert('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar demanda');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Alterações';
    }
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
    
    // Fechar modal de detalhes
    const closeDetalhes = document.querySelector('.close-detalhes');
    if (closeDetalhes) {
        closeDetalhes.addEventListener('click', () => {
            document.getElementById('modalDetalhes').style.display = 'none';
        });
    }
    
    // Fechar modal de edição
    const closeEditar = document.querySelector('.close-editar');
    if (closeEditar) {
        closeEditar.addEventListener('click', fecharModalEdicao);
    }
    
    // Submit do formulário de edição
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', salvarEdicao);
    }
    
    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        const modalDetalhes = document.getElementById('modalDetalhes');
        const modalEditar = document.getElementById('modalEditar');
        
        if (event.target == modalDetalhes) {
            modalDetalhes.style.display = 'none';
        }
        if (event.target == modalEditar) {
            modalEditar.style.display = 'none';
        }
    }
});