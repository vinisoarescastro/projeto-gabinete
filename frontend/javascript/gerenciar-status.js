// Gerenciamento de Status

let statusEmEdicao = null;

// Abrir modal de gerenciar status
async function abrirModalStatus() {
    document.getElementById('modalStatus').style.display = 'block';
    await carregarListaStatus();
}

// Fechar modal
function fecharModalStatus() {
    document.getElementById('modalStatus').style.display = 'none';
    cancelarFormStatus();
}

// Carregar lista de status
async function carregarListaStatus() {
    const token = localStorage.getItem('token');
    const listaStatus = document.getElementById('listaStatus');
    
    try {
        listaStatus.innerHTML = '<p style="text-align: center; color: #6c757d;">Carregando...</p>';
        
        const response = await fetch(`${API_URL}/api/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso && data.status.length > 0) {
            listaStatus.innerHTML = data.status.map(s => {
                const isProtegido = s.ordem === 1 || s.ordem === 5;
                
                return `
                    <div class="status-item ${isProtegido ? 'protegido' : ''}">
                        <div class="status-info">
                            <div class="status-nome">${s.nome}</div>
                            <div class="status-ordem">Ordem: ${s.ordem} ${isProtegido ? '(Protegido)' : ''}</div>
                        </div>
                        <div class="status-acoes">
                            <button class="btn-status btn-editar-status" onclick="editarStatus(${s.id}, '${s.nome}', ${s.ordem})">
                                ✏️ Editar
                            </button>
                            <button 
                                class="btn-status btn-excluir-status" 
                                onclick="confirmarExclusaoStatus(${s.id}, '${s.nome}')"
                                ${isProtegido ? 'disabled title="Status protegido não pode ser excluído"' : ''}
                            >
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaStatus.innerHTML = '<p class="sem-status">Nenhum status encontrado</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        listaStatus.innerHTML = '<p style="text-align: center; color: #dc3545;">Erro ao carregar status</p>';
    }
}

// Mostrar formulário de adicionar
function mostrarFormAdicionar() {
    statusEmEdicao = null;
    document.getElementById('tituloFormStatus').textContent = 'Adicionar Novo Status';
    document.getElementById('nomeStatus').value = '';
    document.getElementById('ordemStatus').value = '';
    document.getElementById('formStatus').classList.add('ativo');
}

// Editar status
function editarStatus(id, nome, ordem) {
    statusEmEdicao = id;
    document.getElementById('tituloFormStatus').textContent = 'Editar Status';
    document.getElementById('nomeStatus').value = nome;
    document.getElementById('ordemStatus').value = ordem;
    document.getElementById('formStatus').classList.add('ativo');
}

// Cancelar formulário
function cancelarFormStatus() {
    statusEmEdicao = null;
    document.getElementById('formStatus').classList.remove('ativo');
    document.getElementById('nomeStatus').value = '';
    document.getElementById('ordemStatus').value = '';
}

// Salvar status (criar ou editar)
async function salvarStatus(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const nome = document.getElementById('nomeStatus').value.trim();
    const ordem = parseInt(document.getElementById('ordemStatus').value) || null;
    
    if (!nome) {
        alert('Digite um nome para o status');
        return;
    }
    
    const btnSalvar = document.querySelector('.btn-salvar-status');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    
    try {
        let response;
        
        if (statusEmEdicao) {
            // Editar
            response = await fetch(`${API_URL}/api/status/${statusEmEdicao}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, ordem })
            });
        } else {
            // Criar novo
            response = await fetch(`${API_URL}/api/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, ordem })
            });
        }
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert(data.mensagem);
            cancelarFormStatus();
            await carregarListaStatus();
            await buscarDemandas(); // Recarregar kanban
        } else {
            alert('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar status');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
    }
}

// Confirmar exclusão
function confirmarExclusaoStatus(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o status "${nome}"?\n\nAtenção: Só é possível excluir status vazios (sem demandas).`)) {
        excluirStatus(id);
    }
}

// Excluir status
async function excluirStatus(id) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/status/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert(data.mensagem);
            await carregarListaStatus();
            await buscarDemandas(); // Recarregar kanban
        } else {
            alert('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir status');
    }
}