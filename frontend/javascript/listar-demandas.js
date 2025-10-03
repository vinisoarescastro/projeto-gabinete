const API_URL = 'http://localhost:3000';
let todasDemandas = [];
let demandaIdParaExcluir = null;


// Verificar autenticação ao carregar
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return null;
    }
    
    return JSON.parse(usuario);
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

// Pegar apenas primeiro e último nome
function getNomeSobrenome(nomeCompleto) {
    if (!nomeCompleto) return 'N/A';
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

// Converter quebras de linha em <br>
function formatarTextoComQuebras(texto) {
    if (!texto) return 'Sem descrição';
    return texto.replace(/\n/g, '<br>');
}

// Buscar todas as demandas
async function buscarDemandas() {
    const token = localStorage.getItem('token');
    const corpoTabela = document.getElementById('corpoTabela');
    
    try {
        corpoTabela.innerHTML = '<tr><td colspan="8" class="carregando">Carregando demandas...</td></tr>';
        
        const response = await fetch(`${API_URL}/api/demandas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            todasDemandas = data.demandas;
            renderizarTabela(todasDemandas);
        } else {
            corpoTabela.innerHTML = '<tr><td colspan="8" class="erro">Erro ao carregar demandas</td></tr>';
        }
    } catch (error) {
        console.error('Erro:', error);
        corpoTabela.innerHTML = '<tr><td colspan="8" class="erro">Erro ao conectar com servidor</td></tr>';
    }
}

// Abrir modal de edição
async function abrirModalEdicao(id) {
    const token = localStorage.getItem('token');
    
    try {
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
            buscarDemandas(); // Recarregar lista
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

// Renderizar tabela
function renderizarTabela(demandas) {
    const corpoTabela = document.getElementById('corpoTabela');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (demandas.length === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="8" class="vazio">Nenhuma demanda encontrada</td></tr>';
        return;
    }
    
    corpoTabela.innerHTML = demandas.map(d => {
        // Verificar se usuário pode editar
        const podeEditar =
            usuario.nivel_permissao === 'administrador' ||
            usuario.nivel_permissao === 'chefe_gabinete' ||
            usuario.nivel_permissao === 'supervisor' ||
            d.usuario_responsavel_id === usuario.id;

        return `
        <tr>
            <td>${d.titulo}</td>
            <td><span class="badge prioridade-${d.prioridade}">${d.prioridade}</span></td>
            <td>${getNomeSobrenome(d.cidadaos?.nome_completo)}</td>
            <td>${getNomeSobrenome(d.usuario_responsavel?.nome_completo)}</td>
            <td><span class="badge status-${d.status_id}">${d.status?.nome || 'N/A'}</span></td>
            <td>${formatarData(d.criado_em)}</td>
            <td>${formatarData(d.atualizado_em)}</td>
            <td class="acoes">
                <button class="btn-visualizar" onclick="visualizarDemanda(${d.id})" title="Ver detalhes">👁️</button>
                ${podeEditar ? `<button class="btn-editar" onclick="abrirModalEdicao(${d.id})" title="Editar">✏️</button>` : ''}
                <button class="btn-excluir-demanda" onclick="confirmarExclusao(${d.id}, '${d.titulo.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// Formatar data (apenas data, sem hora)
function formatarData(dataISO) {
    const data = new Date(dataISO);
    
    const opcoes = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    return data.toLocaleDateString('pt-BR', opcoes);
}

// Aplicar filtros
function aplicarFiltros() {
    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroPrioridade = document.getElementById('filtroPrioridade').value;
    const filtroBusca = document.getElementById('filtroBusca').value.toLowerCase();
    const filtroDataInicio = document.getElementById('filtroDataInicio').value;
    const filtroDataFim = document.getElementById('filtroDataFim').value;
    
    let demandasFiltradas = todasDemandas.filter(d => {
        // Filtro de busca por título ou cidadão
        const passaBusca = !filtroBusca || 
            d.titulo.toLowerCase().includes(filtroBusca) ||
            (d.cidadaos?.nome_completo || '').toLowerCase().includes(filtroBusca);
        
        // Filtro de prioridade
        const passaPrioridade = !filtroPrioridade || d.prioridade === filtroPrioridade;
        
        // Filtro de status
        const passaStatus = !filtroStatus || d.status_id === parseInt(filtroStatus);
        
        // Filtro de data
        let passaData = true;
        if (filtroDataInicio) {
            const dataInicio = new Date(filtroDataInicio + 'T00:00:00');
            const dataDemanda = new Date(d.criado_em);
            passaData = dataDemanda >= dataInicio;
        }
        if (filtroDataFim && passaData) {
            const dataFim = new Date(filtroDataFim + 'T23:59:59');
            const dataDemanda = new Date(d.criado_em);
            passaData = dataDemanda <= dataFim;
        }
        
        return passaBusca && passaPrioridade && passaStatus && passaData;
    });
    
    renderizarTabela(demandasFiltradas);
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroPrioridade').value = '';
    document.getElementById('filtroBusca').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    renderizarTabela(todasDemandas);
}

// Confirmar exclusão
function confirmarExclusao(id, titulo) {
    demandaIdParaExcluir = id;
    document.getElementById('tituloDemandaExcluir').textContent = titulo;
    document.getElementById('modalExcluir').style.display = 'block';
}

// Excluir demanda
async function excluirDemanda() {
    const token = localStorage.getItem('token');
    const btnExcluir = document.getElementById('btnConfirmarExclusao');
    
    btnExcluir.disabled = true;
    btnExcluir.textContent = 'Excluindo...';
    
    try {
        const response = await fetch(`${API_URL}/api/demandas/${demandaIdParaExcluir}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert('Demanda excluída com sucesso!');
            document.getElementById('modalExcluir').style.display = 'none';
            buscarDemandas();
        } else {
            alert('Erro ao excluir demanda: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir demanda');
    } finally {
        btnExcluir.disabled = false;
        btnExcluir.textContent = 'Excluir';
    }
}

// VISUALIZAR DEMANDA

let demandaAtualId = null;
// Visualizar demanda
async function visualizarDemanda(id) {
    demandaAtualId = id;
    const token = localStorage.getItem('token');
    
    try {
        // Buscar demanda completa
        const response = await fetch(`${API_URL}/api/demandas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            preencherModalDetalhes(data.demanda);
            document.getElementById('modalDetalhes').style.display = 'block';
            carregarComentarios(id);
        } else {
            alert('Erro ao carregar detalhes da demanda');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes');
    }
}

// Preencher modal com dados da demanda
function preencherModalDetalhes(demanda) {
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
}

// Formatar data com hora (corrigindo fuso horário)
function formatarDataHora(dataISO) {
    const data = new Date(dataISO);
    
    // Ajustar para horário de Brasília (UTC-3)
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

// Carregar comentários
async function carregarComentarios(demandaId) {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const listaComentarios = document.getElementById('listaComentarios');
    
    try {
        const response = await fetch(`${API_URL}/api/comentarios/demanda/${demandaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            if (data.comentarios.length === 0) {
                listaComentarios.innerHTML = '<p class="sem-comentarios">Nenhum comentário ainda</p>';
            } else {
                listaComentarios.innerHTML = data.comentarios.map(c => {
                    // Verificar se pode excluir
                    const podeExcluir = 
                        usuario.nivel_permissao === 'administrador' ||
                        usuario.nivel_permissao === 'chefe_gabinete' ||
                        c.usuario_id === usuario.id;

                    return `
                        <div class="comentario-item">
                            <div class="comentario-header">
                                <span class="comentario-autor">${c.usuarios?.nome_completo || 'Usuário'}</span>
                                <div>
                                    <span class="comentario-data">${formatarDataHora(c.criado_em)}</span>
                                    ${podeExcluir ? `<button class="btn-excluir-comentario" onclick="excluirComentario(${c.id})" title="Excluir comentário">🗑️</button>` : ''}
                                </div>
                            </div>
                            <div class="comentario-texto">${c.comentario}</div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        listaComentarios.innerHTML = '<p class="erro">Erro ao carregar comentários</p>';
    }
}

// Excluir comentário
async function excluirComentario(id) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/comentarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            // Recarregar comentários
            carregarComentarios(demandaAtualId);
        } else {
            alert('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir comentário');
    }
}

// Adicionar comentário
async function adicionarComentario() {
    const token = localStorage.getItem('token');
    const comentario = document.getElementById('novoComentario').value.trim();
    
    if (!comentario) {
        alert('Digite um comentário');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/comentarios`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                demanda_id: demandaAtualId,
                comentario: comentario
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            document.getElementById('novoComentario').value = '';
            carregarComentarios(demandaAtualId);
        } else {
            alert('Erro ao adicionar comentário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar comentário');
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
    
    // Botão sair
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', logout);
    }
    
    // Filtros
    document.getElementById('filtroStatus')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroPrioridade')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroBusca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtroDataInicio')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroDataFim')?.addEventListener('change', aplicarFiltros);
    document.getElementById('btnLimparFiltros')?.addEventListener('click', limparFiltros);
    
    // Modal de detalhes
    const closeDetalhes = document.querySelector('.close-detalhes');
    closeDetalhes?.addEventListener('click', () => {
        document.getElementById('modalDetalhes').style.display = 'none';
    });

    // Modal de exclusão
    const closeExcluir = document.querySelector('.close-excluir');
    const btnCancelarExclusao = document.getElementById('btnCancelarExclusao');
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    
    closeExcluir?.addEventListener('click', () => {
        document.getElementById('modalExcluir').style.display = 'none';
    });
    
    btnCancelarExclusao?.addEventListener('click', () => {
        document.getElementById('modalExcluir').style.display = 'none';
    });
    
    btnConfirmarExclusao?.addEventListener('click', excluirDemanda);

    // Modal de edição
    const closeEditar = document.querySelector('.close-editar');
    closeEditar?.addEventListener('click', fecharModalEdicao);

    const formEditar = document.getElementById('formEditar');
    formEditar?.addEventListener('submit', salvarEdicao);
});