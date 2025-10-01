// Função para aplicar máscara de telefone
function aplicarMascaraTelefone(valor) {
    valor = valor.replace(/\D/g, '');
    
    if (valor.length <= 10) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    }
    
    return valor;
}

// Funções do Modal de Cadastro de Demanda
function abrirModalDemanda() {
    const modal = document.getElementById('modalDemanda');
    modal.style.display = 'block';
    carregarDadosFormulario();
}

function fecharModalDemanda() {
    const modal = document.getElementById('modalDemanda');
    modal.style.display = 'none';
    document.getElementById('formDemanda').reset();
    limparCamposCidadao();
}

// Carregar dados para os selects
async function carregarDadosFormulario() {
    const token = localStorage.getItem('token');
    
    try {
        // Buscar status
        const statusRes = await fetch(`${API_URL}/api/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statusData = await statusRes.json();
        
        const selectStatus = document.getElementById('status_id');
        selectStatus.innerHTML = '<option value="">Selecione...</option>';
        statusData.status.forEach(s => {
            selectStatus.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
        });

        // Buscar usuários
        const usuariosRes = await fetch(`${API_URL}/api/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuariosData = await usuariosRes.json();
        
        const selectUsuarios = document.getElementById('usuario_responsavel_id');
        selectUsuarios.innerHTML = '<option value="">Selecione...</option>';
        usuariosData.usuarios.forEach(u => {
            selectUsuarios.innerHTML += `<option value="${u.id}">${u.nome_completo}</option>`;
        });

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Tente novamente.');
    }
}

// Buscar cidadão por telefone
async function buscarCidadaoPorTelefone(telefone) {
    const token = localStorage.getItem('token');
    const statusBusca = document.getElementById('status_busca');
    
    statusBusca.textContent = '';
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
        limparCamposCidadao();
        return;
    }
    
    try {
        statusBusca.textContent = 'Buscando...';
        statusBusca.style.color = '#3498db';
        
        const response = await fetch(`${API_URL}/api/cidadaos/telefone/${telefoneLimpo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.encontrado) {
            preencherDadosCidadao(data.cidadao);
            statusBusca.textContent = 'Cidadão encontrado! Dados preenchidos automaticamente.';
            statusBusca.style.color = '#27ae60';
        } else {
            limparCamposCidadao();
            statusBusca.textContent = 'Cidadão não encontrado. Preencha os dados para cadastrar.';
            statusBusca.style.color = '#e67e22';
        }
    } catch (error) {
        console.error('Erro ao buscar cidadão:', error);
        statusBusca.textContent = 'Erro ao buscar. Tente novamente.';
        statusBusca.style.color = '#e74c3c';
    }
}

// Preencher campos com dados do cidadão
function preencherDadosCidadao(cidadao) {
    document.getElementById('cidadao_id').value = cidadao.id;
    document.getElementById('nome_cidadao').value = cidadao.nome_completo;
    document.getElementById('data_nascimento_cidadao').value = cidadao.data_nascimento;
    document.getElementById('bairro_cidadao').value = cidadao.bairro;
    document.getElementById('cidade_cidadao').value = cidadao.cidade;
    document.getElementById('estado_cidadao').value = cidadao.estado;
    document.getElementById('email_cidadao').value = cidadao.email || '';
    
    // Desabilitar campos
    document.getElementById('nome_cidadao').disabled = true;
    document.getElementById('data_nascimento_cidadao').disabled = true;
    document.getElementById('bairro_cidadao').disabled = true;
    document.getElementById('cidade_cidadao').disabled = true;
    document.getElementById('estado_cidadao').disabled = true;
    document.getElementById('email_cidadao').disabled = true;
}

// Limpar campos do cidadão
function limparCamposCidadao() {
    document.getElementById('cidadao_id').value = '';
    document.getElementById('nome_cidadao').value = '';
    document.getElementById('data_nascimento_cidadao').value = '';
    document.getElementById('bairro_cidadao').value = '';
    document.getElementById('cidade_cidadao').value = '';
    document.getElementById('estado_cidadao').value = '';
    document.getElementById('email_cidadao').value = '';
    
    // Habilitar campos
    document.getElementById('nome_cidadao').disabled = false;
    document.getElementById('data_nascimento_cidadao').disabled = false;
    document.getElementById('bairro_cidadao').disabled = false;
    document.getElementById('cidade_cidadao').disabled = false;
    document.getElementById('estado_cidadao').disabled = false;
    document.getElementById('email_cidadao').disabled = false;
}

// Enviar demanda
async function enviarDemanda(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const btnSalvar = document.querySelector('.btn-salvar');
    
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    
    try {
        let cidadaoId = document.getElementById('cidadao_id').value;
        
        // Se cidadão não existe, cadastrar primeiro
        if (!cidadaoId) {
            const cidadaoData = {
                nome_completo: document.getElementById('nome_cidadao').value,
                telefone: document.getElementById('telefone_cidadao').value.replace(/\D/g, ''),
                data_nascimento: document.getElementById('data_nascimento_cidadao').value,
                bairro: document.getElementById('bairro_cidadao').value,
                cidade: document.getElementById('cidade_cidadao').value,
                estado: document.getElementById('estado_cidadao').value,
                email: document.getElementById('email_cidadao').value
            };
            
            const cidadaoRes = await fetch(`${API_URL}/api/cidadaos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cidadaoData)
            });
            
            const cidadaoResult = await cidadaoRes.json();
            if (!cidadaoResult.sucesso) {
                throw new Error(cidadaoResult.mensagem || 'Erro ao cadastrar cidadão');
            }
            
            cidadaoId = cidadaoResult.cidadao.id;
        }
        
        // Cadastrar demanda
        const demandaData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            prioridade: document.getElementById('prioridade').value,
            cidadao_id: parseInt(cidadaoId),
            usuario_responsavel_id: parseInt(document.getElementById('usuario_responsavel_id').value),
            usuario_origem_id: usuario.id,
            status_id: parseInt(document.getElementById('status_id').value)
        };
        
        const demandaRes = await fetch(`${API_URL}/api/demandas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(demandaData)
        });
        
        const result = await demandaRes.json();
        
        if (result.sucesso) {
            alert('Demanda cadastrada com sucesso!');
            fecharModalDemanda();
            location.reload(); // Recarregar para atualizar dashboard
        } else {
            throw new Error(result.mensagem || 'Erro ao cadastrar demanda');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar: ' + error.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Cadastrar';
    }
}

// Inicializar eventos do modal
document.addEventListener('DOMContentLoaded', function() {
    // Botão nova demanda
    const btnNovaDemanda = document.querySelector('.btn.nova-demanda');
    if (btnNovaDemanda) {
        btnNovaDemanda.addEventListener('click', abrirModalDemanda);
    }

    // Fechar modal
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', fecharModalDemanda);
    }

    const btnCancelar = document.querySelector('.btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModalDemanda);
    }

    // Fechar ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('modalDemanda');
        if (event.target == modal) {
            fecharModalDemanda();
        }
    }

    // Campo telefone - aplicar máscara e buscar cidadão
    const telefoneCidadao = document.getElementById('telefone_cidadao');
    if (telefoneCidadao) {
        telefoneCidadao.addEventListener('input', function(e) {
            e.target.value = aplicarMascaraTelefone(e.target.value);
    });
    
    telefoneCidadao.addEventListener('blur', function() {
        buscarCidadaoPorTelefone(this.value);
    });
}

    // Submit do formulário
    const formDemanda = document.getElementById('formDemanda');
    if (formDemanda) {
        formDemanda.addEventListener('submit', enviarDemanda);
    }
});