/**
 * Componente de Modal de Cadastro de Demanda
 * Gerencia cadastro de novas demandas com busca automática de cidadão
 */

import { 
    listarStatus, 
    listarUsuarios, 
    criarDemanda, 
    buscarCidadaoPorTelefone, 
    criarCidadao 
} from '../utils/api.js';
import { aplicarMascaraTelefone, limparTelefone } from '../utils/formatters.js';
import { mostrarErro, mostrarSucesso, botaoLoading } from '../utils/notifications.js';
import { getUsuarioLogado } from '../utils/auth.js';

// ==========================================
// VARIÁVEIS GLOBAIS DO MÓDULO
// ==========================================

let callbackAposCadastrar = null;
let buscaEmAndamento = false;

// ==========================================
// FUNÇÕES PRINCIPAIS (EXPORTADAS)
// ==========================================

/**
 * Abre o modal de cadastro de demanda
 * @param {Function} callback - Função a ser executada após cadastro bem-sucedido
 */
export async function abrirModalCadastro(callback) {
    console.log('🚀 Abrindo modal de cadastro');
    callbackAposCadastrar = callback;
    
    await carregarDadosFormulario();
    limparFormulario();
    mostrarModal();
}

/**
 * Fecha o modal de cadastro
 */
export function fecharModalCadastro() {
    console.log('🚪 Fechando modal de cadastro');
    const modal = document.getElementById('modalDemanda');
    if (modal) {
        modal.style.display = 'none';
    }
    
    limparFormulario();
}

/**
 * Inicializa eventos do modal de cadastro
 */
export function inicializarModalCadastro() {
    console.log('🚀 Inicializando modal de cadastro');
    
    // Verificar se modal existe
    const modal = document.getElementById('modalDemanda');
    if (!modal) {
        console.error('❌ Modal de cadastro não encontrado no HTML');
        return;
    }
    
    // Botão fechar (X)
    const closeModal = document.querySelector('#modalDemanda .close');
    if (closeModal) {
        closeModal.onclick = fecharModalCadastro;
        console.log('✅ Botão fechar (X) configurado');
    }

    // Botão cancelar
    const btnCancelar = document.querySelector('#modalDemanda .btn-cancelar');
    if (btnCancelar) {
        btnCancelar.onclick = fecharModalCadastro;
        console.log('✅ Botão cancelar configurado');
    }

    // Campo telefone - eventos
    const telefoneCidadao = document.getElementById('telefone_cidadao');
    if (telefoneCidadao) {
        console.log('📱 Configurando eventos do campo telefone...');
        
        // Aplicar máscara ao digitar
        telefoneCidadao.oninput = function(e) {
            console.log('⌨️ Input event disparado');
            e.target.value = aplicarMascaraTelefone(e.target.value);
        };
        
        // Buscar cidadão ao sair do campo
        telefoneCidadao.onblur = function() {
            console.log('👋 Blur event disparado');
            buscarCidadao(this.value);
        };
        
        // Buscar ao pressionar Enter
        telefoneCidadao.onkeypress = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('⏎ Enter pressionado');
                buscarCidadao(this.value);
            }
        };
        
        console.log('✅ Eventos do telefone configurados');
    } else {
        console.error('❌ Campo telefone_cidadao não encontrado');
    }

    // Botão de buscar cidadão (se existir)
    const btnBuscar = document.getElementById('btnBuscarCidadao');
    if (btnBuscar) {
        console.log('🔍 Configurando botão de busca...');
        btnBuscar.onclick = function() {
            const telefone = document.getElementById('telefone_cidadao')?.value;
            console.log('🔍 Botão buscar clicado, telefone:', telefone);
            if (telefone) {
                buscarCidadao(telefone);
            } else {
                mostrarMensagemBusca('Digite um telefone primeiro', 'aviso');
            }
        };
        console.log('✅ Botão de busca configurado');
    }

    // Submit do formulário
    const formDemanda = document.getElementById('formDemanda');
    if (formDemanda) {
        console.log('📝 Configurando submit do formulário...');
        formDemanda.onsubmit = enviarDemanda;
        console.log('✅ Submit configurado');
    } else {
        console.error('❌ Formulário formDemanda não encontrado');
    }
    
    // Fechar ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('modalDemanda');
        if (event.target === modal) {
            fecharModalCadastro();
        }
    };
    
    console.log('✅ Modal de cadastro inicializado com sucesso');
}

// ==========================================
// FUNÇÕES AUXILIARES (PRIVADAS)
// ==========================================

/**
 * Carrega dados para os selects (status e usuários)
 */
async function carregarDadosFormulario() {
    console.log('📦 Carregando dados do formulário...');
    
    try {
        // Buscar status
        const statusData = await listarStatus();
        const selectStatus = document.getElementById('status_id');
        
        if (selectStatus && statusData.sucesso) {
            selectStatus.innerHTML = '<option value="">Selecione...</option>' +
                statusData.status.map(s => 
                    `<option value="${s.id}">${s.nome}</option>`
                ).join('');
            console.log('✅ Status carregados:', statusData.status.length);
        }

        // Buscar usuários
        const usuariosData = await listarUsuarios();
        const selectUsuarios = document.getElementById('usuario_responsavel_id');
        
        if (selectUsuarios && usuariosData.sucesso) {
            selectUsuarios.innerHTML = '<option value="">Selecione...</option>' +
                usuariosData.usuarios.map(u => 
                    `<option value="${u.id}">${u.nome_completo}</option>`
                ).join('');
            console.log('✅ Usuários carregados:', usuariosData.usuarios.length);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do formulário');
    }
}

/**
 * Busca cidadão por telefone
 * @param {string} telefone
 */
async function buscarCidadao(telefone) {
    console.log('🔍 Iniciando busca de cidadão...');
    console.log('📞 Telefone recebido:', telefone);
    
    const statusBusca = document.getElementById('status_busca');
    const fieldset = document.querySelector('fieldset');
    
    if (!statusBusca) {
        console.error('❌ Elemento status_busca não encontrado');
        return;
    }
    
    // Limpar mensagem anterior
    statusBusca.textContent = '';
    statusBusca.className = '';
    
    const telefoneLimpo = limparTelefone(telefone);
    console.log('📞 Telefone limpo:', telefoneLimpo);
    
    // Validar telefone
    if (telefoneLimpo.length < 10) {
        console.log('⚠️ Telefone incompleto:', telefoneLimpo.length, 'dígitos');
        limparCamposCidadao();
        if (telefoneLimpo.length > 0) {
            mostrarMensagemBusca('Telefone incompleto. Digite pelo menos 10 dígitos.', 'aviso');
        }
        return;
    }
    
    // Evitar múltiplas buscas simultâneas
    if (buscaEmAndamento) {
        console.log('⏳ Busca já em andamento, aguarde...');
        return;
    }
    
    buscaEmAndamento = true;
    
    try {
        // Mostrar loading
        mostrarMensagemBusca('🔍 Buscando cidadão...', 'buscando');
        
        // Adicionar efeito visual no fieldset
        if (fieldset) {
            fieldset.style.opacity = '0.6';
            fieldset.style.transition = 'opacity 0.3s';
        }
        
        console.log('🌐 Fazendo requisição para API...');
        const data = await buscarCidadaoPorTelefone(telefoneLimpo);
        console.log('✅ Resposta da API:', data);
        
        if (data.encontrado) {
            console.log('✅ Cidadão encontrado:', data.cidadao);
            preencherDadosCidadao(data.cidadao);
            mostrarMensagemBusca('✅ Cidadão encontrado! Dados preenchidos automaticamente.', 'sucesso');
            
            // Animar preenchimento
            if (fieldset) {
                fieldset.style.opacity = '1';
                fieldset.classList.add('campos-preenchidos');
            }
        } else {
            console.log('⚠️ Cidadão não encontrado');
            limparCamposCidadao();
            mostrarMensagemBusca('⚠️ Cidadão não encontrado. Preencha os dados para cadastrar novo.', 'aviso');
            
            if (fieldset) {
                fieldset.style.opacity = '1';
                fieldset.classList.remove('campos-preenchidos');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao buscar cidadão:', error);
        mostrarMensagemBusca('❌ Erro ao buscar. Tente novamente.', 'erro');
        
        if (fieldset) {
            fieldset.style.opacity = '1';
        }
    } finally {
        buscaEmAndamento = false;
        console.log('✅ Busca finalizada');
    }
}

/**
 * Mostra mensagem de status da busca
 * @param {string} mensagem
 * @param {string} tipo - 'sucesso', 'erro', 'aviso', 'buscando'
 */
function mostrarMensagemBusca(mensagem, tipo) {
    const statusBusca = document.getElementById('status_busca');
    if (!statusBusca) return;
    
    statusBusca.textContent = mensagem;
    statusBusca.className = `status-busca ${tipo}`;
    
    // Cores baseadas no tipo
    const cores = {
        sucesso: '#27ae60',
        erro: '#e74c3c',
        aviso: '#e67e22',
        buscando: '#3498db'
    };
    
    statusBusca.style.color = cores[tipo] || '#666';
    statusBusca.style.fontSize = '13px';
    statusBusca.style.fontWeight = '500';
    statusBusca.style.marginTop = '8px';
    statusBusca.style.display = 'block';
    statusBusca.style.animation = 'fadeIn 0.3s ease-in';
}

/**
 * Preenche campos com dados do cidadão encontrado
 * @param {Object} cidadao
 */
function preencherDadosCidadao(cidadao) {
    console.log('📝 Preenchendo dados do cidadão...');
    
    // Preencher campos com animação
    const campos = [
        { id: 'cidadao_id', valor: cidadao.id },
        { id: 'nome_cidadao', valor: cidadao.nome_completo },
        { id: 'data_nascimento_cidadao', valor: cidadao.data_nascimento },
        { id: 'bairro_cidadao', valor: cidadao.bairro },
        { id: 'cidade_cidadao', valor: cidadao.cidade },
        { id: 'estado_cidadao', valor: cidadao.estado },
        { id: 'email_cidadao', valor: cidadao.email || '' }
    ];
    
    // Preencher com delay para criar efeito de animação
    campos.forEach((campo, index) => {
        setTimeout(() => {
            setarValorElementoAnimado(campo.id, campo.valor);
        }, index * 50); // 50ms de delay entre cada campo
    });
    
    // Desabilitar campos após preenchimento
    setTimeout(() => {
        desabilitarCamposCidadao(true);
        adicionarEstilosCamposPreenchidos();
        console.log('✅ Campos preenchidos e desabilitados');
    }, campos.length * 50);
}

/**
 * Define valor de um elemento com animação
 * @param {string} id
 * @param {string} valor
 */
function setarValorElementoAnimado(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.value = valor;
        
        // Adicionar animação visual
        elemento.style.transition = 'all 0.3s ease';
        elemento.style.backgroundColor = '#e8f5e9'; // Verde claro
        
        // Voltar ao normal após 500ms
        setTimeout(() => {
            elemento.style.backgroundColor = '';
        }, 500);
    }
}

/**
 * Adiciona estilos aos campos preenchidos automaticamente
 */
function adicionarEstilosCamposPreenchidos() {
    const campos = [
        'nome_cidadao',
        'data_nascimento_cidadao',
        'bairro_cidadao',
        'cidade_cidadao',
        'estado_cidadao',
        'email_cidadao'
    ];
    
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && elemento.disabled) {
            elemento.style.backgroundColor = '#f5f5f5';
            elemento.style.cursor = 'not-allowed';
            elemento.style.border = '1px solid #27ae60';
        }
    });
}

/**
 * Limpa campos do cidadão
 */
function limparCamposCidadao() {
    console.log('🧹 Limpando campos do cidadão...');
    
    const campos = [
        'cidadao_id',
        'nome_cidadao',
        'data_nascimento_cidadao',
        'bairro_cidadao',
        'cidade_cidadao',
        'estado_cidadao',
        'email_cidadao'
    ];
    
    campos.forEach(id => {
        setarValorElemento(id, '');
    });
    
    // Habilitar campos
    desabilitarCamposCidadao(false);
    removerEstilosCamposPreenchidos();
}

/**
 * Remove estilos dos campos
 */
function removerEstilosCamposPreenchidos() {
    const campos = [
        'nome_cidadao',
        'data_nascimento_cidadao',
        'bairro_cidadao',
        'cidade_cidadao',
        'estado_cidadao',
        'email_cidadao'
    ];
    
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.backgroundColor = '';
            elemento.style.cursor = '';
            elemento.style.border = '';
        }
    });
}

/**
 * Define valor de um elemento com verificação de existência
 * @param {string} id - ID do elemento
 * @param {string} valor - Valor a ser definido
 */
function setarValorElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.value = valor;
    }
}

/**
 * Habilita/Desabilita campos do cidadão
 * @param {boolean} desabilitar
 */
function desabilitarCamposCidadao(desabilitar) {
    const campos = [
        'nome_cidadao',
        'data_nascimento_cidadao',
        'bairro_cidadao',
        'cidade_cidadao',
        'estado_cidadao',
        'email_cidadao'
    ];
    
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.disabled = desabilitar;
        }
    });
}

/**
 * Envia o formulário de cadastro
 */
async function enviarDemanda(e) {
    e.preventDefault();
    console.log('💾 Enviando demanda...');
    
    const btnSalvar = document.querySelector('#formDemanda .btn-salvar');
    
    if (!btnSalvar) {
        console.error('❌ Botão salvar não encontrado');
        return;
    }
    
    const restaurarBotao = botaoLoading(btnSalvar, 'Salvando...');
    
    try {
        const usuario = getUsuarioLogado();
        let cidadaoId = document.getElementById('cidadao_id')?.value || '';
        
        // Se cidadão não existe, cadastrar primeiro
        if (!cidadaoId) {
            console.log('📝 Cadastrando novo cidadão...');
            
            const cidadaoData = {
                nome_completo: document.getElementById('nome_cidadao')?.value || '',
                telefone: limparTelefone(document.getElementById('telefone_cidadao')?.value || ''),
                data_nascimento: document.getElementById('data_nascimento_cidadao')?.value || '',
                bairro: document.getElementById('bairro_cidadao')?.value || '',
                cidade: document.getElementById('cidade_cidadao')?.value || '',
                estado: document.getElementById('estado_cidadao')?.value || '',
                email: document.getElementById('email_cidadao')?.value || ''
            };
            
            const cidadaoResult = await criarCidadao(cidadaoData);
            
            if (!cidadaoResult.sucesso) {
                throw new Error(cidadaoResult.mensagem || 'Erro ao cadastrar cidadão');
            }
            
            cidadaoId = cidadaoResult.cidadao.id;
            console.log('✅ Cidadão cadastrado, ID:', cidadaoId);
        }
        
        // Cadastrar demanda
        console.log('📝 Cadastrando demanda...');
        
        const demandaData = {
            titulo: document.getElementById('titulo')?.value || '',
            descricao: document.getElementById('descricao')?.value || '',
            prioridade: document.getElementById('prioridade')?.value || '',
            cidadao_id: parseInt(cidadaoId),
            usuario_responsavel_id: parseInt(document.getElementById('usuario_responsavel_id')?.value || 0),
            usuario_origem_id: usuario.id,
            status_id: parseInt(document.getElementById('status_id')?.value || 0)
        };
        
        console.log('📦 Dados da demanda:', demandaData);
        
        const result = await criarDemanda(demandaData);
        
        if (result.sucesso) {
            console.log('✅ Demanda cadastrada com sucesso!');
            mostrarSucesso('Demanda cadastrada com sucesso!');
            fecharModalCadastro();
            
            // Executar callback se fornecido
            if (callbackAposCadastrar) {
                console.log('🔄 Executando callback...');
                callbackAposCadastrar();
            }
        } else {
            throw new Error(result.mensagem || 'Erro ao cadastrar demanda');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        mostrarErro('Erro ao cadastrar: ' + error.message);
        restaurarBotao();
    }
}

/**
 * Limpa o formulário
 */
function limparFormulario() {
    console.log('🧹 Limpando formulário...');
    
    const form = document.getElementById('formDemanda');
    if (form) {
        form.reset();
    }
    
    limparCamposCidadao();
    
    const statusBusca = document.getElementById('status_busca');
    if (statusBusca) {
        statusBusca.textContent = '';
        statusBusca.className = '';
    }
    
    buscaEmAndamento = false;
}

/**
 * Mostra o modal
 */
function mostrarModal() {
    const modal = document.getElementById('modalDemanda');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ Modal exibido');
    } else {
        console.error('❌ Modal de cadastro não encontrado no DOM');
        mostrarErro('Erro ao abrir modal: elemento não encontrado');
    }
}