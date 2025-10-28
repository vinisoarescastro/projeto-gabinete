/**
 * Página de Eventos e Lista de Presença
 * Sistema de Gestão de Gabinete
 */

import { verificarAutenticacao, logout, getUsuarioLogado } from '../utils/auth.js';
import { inicializarHeader } from '../components/header.js';
import { 
    listarEventos, 
    buscarUltimoEvento, 
    criarEvento,
    listarPresencas,
    buscarPorTelefone,
    registrarPresenca,
    excluirPresenca,
    buscarEstatisticasGerais,
    buscarContagemPorEvento  
} from '../utils/api.js';
import { mostrarSucesso, mostrarErro, mostrarAviso, botaoLoading } from '../utils/notifications.js';
import { formatarDataHora, aplicarMascaraTelefone } from '../utils/formatters.js';

// Variáveis globais
let usuarioLogado = null;
let eventosDisponiveis = [];
let presencasCarregadas = [];

/**
 * Inicialização da página
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    usuarioLogado = verificarAutenticacao();
    if (!usuarioLogado) return;

    // Configurar interface
    inicializarHeader();
    configurarEventListeners();
    
    // Carregar dados iniciais
    carregarEventos();
    verificarPermissoesVisualizacao();
    
    // ✅ NOVO: Aplicar máscara de telefone E busca automática IMEDIATA
    const inputTelefone = document.getElementById('inputTelefone');
    
    inputTelefone.addEventListener('input', (e) => {
        // Aplicar máscara
        e.target.value = aplicarMascaraTelefone(e.target.value);
        
        // Buscar IMEDIATAMENTE quando telefone estiver completo
        const telefone = e.target.value.replace(/\D/g, '');
        
        // Se telefone completo (11 dígitos com DDD), busca IMEDIATAMENTE
        if (telefone.length === 11) {
            buscarDadosPorTelefoneAutomatico(telefone);
        } 
        // Se telefone fixo completo (10 dígitos), também busca
        else if (telefone.length === 10) {
            buscarDadosPorTelefoneAutomatico(telefone);
        }
        // Limpar campos se telefone for apagado
        else if (telefone.length === 0) {
            document.getElementById('inputNome').value = '';
            document.getElementById('inputEmail').value = '';
        }
    });
});

/**
 * Configura todos os event listeners
 */
function configurarEventListeners() {
    // Botão novo evento
    const btnNovoEvento = document.getElementById('btnNovoEvento');
    if (btnNovoEvento) {
        btnNovoEvento.addEventListener('click', abrirModalEvento);
    }

    // Formulário de evento
    const formEvento = document.getElementById('formEvento');
    if (formEvento) {
        formEvento.addEventListener('submit', salvarEvento);
    }

    // Botões do modal de evento
    document.getElementById('btnFecharModalEvento')?.addEventListener('click', fecharModalEvento);
    document.getElementById('btnCancelarEvento')?.addEventListener('click', fecharModalEvento);

    // Formulário de presença
    const formPresenca = document.getElementById('formPresenca');
    if (formPresenca) {
        formPresenca.addEventListener('submit', salvarPresenca);
    }

    // ✅ MANTIDO: Botão buscar telefone (ainda funciona se clicar)
    const btnBuscarTelefone = document.getElementById('btnBuscarTelefone');
    if (btnBuscarTelefone) {
        btnBuscarTelefone.addEventListener('click', buscarDadosPorTelefone);
    }

    // Botão limpar formulário
    const btnLimparForm = document.getElementById('btnLimparForm');
    if (btnLimparForm) {
        btnLimparForm.addEventListener('click', limparFormularioPresenca);
    }

    // Filtro de evento na lista
    const filtroEvento = document.getElementById('filtroEvento');
    if (filtroEvento) {
        filtroEvento.addEventListener('change', filtrarPresencas);
    }

    // Filtro de nome/telefone
    const filtroNomeTelefone = document.getElementById('filtroNomeTelefone');
    if (filtroNomeTelefone) {
        filtroNomeTelefone.addEventListener('input', filtrarPresencas);
    }

    // ✅ NOVO: Botões de exportação com mensagem de desenvolvimento
    document.getElementById('btnExportarExcel')?.addEventListener('click', exportarExcel);
    document.getElementById('btnExportarPDF')?.addEventListener('click', exportarPDF);
}

/**
 * Verifica se usuário tem permissão para visualizar lista
 */
function verificarPermissoesVisualizacao() {
    const niveisPermitidos = ['administrador', 'chefe_gabinete', 'supervisor', 'assessor_interno'];
    const temPermissao = niveisPermitidos.includes(usuarioLogado.nivel_permissao);

    const secaoLista = document.getElementById('secaoLista');
    const btnNovoEvento = document.getElementById('btnNovoEvento');

    if (!temPermissao) {
        if (secaoLista) secaoLista.style.display = 'none';
        if (btnNovoEvento) btnNovoEvento.style.display = 'none';
    } else {
        if (secaoLista) secaoLista.style.display = 'block';
        if (btnNovoEvento) btnNovoEvento.style.display = 'inline-block';
    }
}

// ============================================
// EVENTOS
// ============================================

/**
 * Carrega lista de eventos
 */
async function carregarEventos() {
    try {
        const data = await listarEventos();

        if (data.sucesso) {
            eventosDisponiveis = data.eventos;
            preencherSelectEventos();
            preencherFiltroEventos();
            
            // ✅ NOVO: Selecionar último evento automaticamente e carregar presenças
            await selecionarUltimoEvento();
            
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        mostrarErro('Erro ao carregar eventos');
    }
}

/**
 * ✅ NOVO: Seleciona o último evento cadastrado automaticamente
 */
async function selecionarUltimoEvento() {
    const selectEvento = document.getElementById('selectEvento');
    
    if (!selectEvento || eventosDisponiveis.length === 0) {
        // Se não há eventos, carregar todas as presenças
        await carregarPresencas(null);
        return;
    }
    
    // Pegar eventos ativos ordenados por data (mais recente primeiro)
    const eventosAtivos = eventosDisponiveis
        .filter(e => e.ativo)
        .sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
    
    if (eventosAtivos.length > 0) {
        // Selecionar o último evento cadastrado (mais recente)
        const ultimoEvento = eventosAtivos[0];
        selectEvento.value = ultimoEvento.id;
        
        console.log(`✅ Último evento selecionado: ${ultimoEvento.nome}`);
    }
    
    // ✅ Carregar lista de presenças de TODOS os eventos
    await carregarPresencas(null);
}

/**
 * Preenche select de eventos no formulário
 */
function preencherSelectEventos() {
    const select = document.getElementById('selectEvento');
    const filtro = document.getElementById('filtroEvento');

    if (!select) return;

    select.innerHTML = '<option value="">Selecione um evento</option>';

    // ✅ NOVO: Ordenar eventos por data (mais recentes primeiro)
    const eventosOrdenados = eventosDisponiveis
        .filter(e => e.ativo)
        .sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

    eventosOrdenados.forEach(evento => {
        const option = document.createElement('option');
        option.value = evento.id;
        option.textContent = `${evento.nome} - ${formatarDataHora(evento.data_evento)}`;
        select.appendChild(option);
    });
}

/**
 * Preenche filtro de eventos
 */
function preencherFiltroEventos() {
    const filtro = document.getElementById('filtroEvento');

    if (!filtro) return;

    filtro.innerHTML = '<option value="">Todos os eventos</option>';

    // ✅ NOVO: Ordenar eventos por data (mais recentes primeiro)
    const eventosOrdenados = eventosDisponiveis
        .sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

    eventosOrdenados.forEach(evento => {
        const option = document.createElement('option');
        option.value = evento.id;
        option.textContent = `${evento.nome} - ${formatarDataHora(evento.data_evento)}`;
        filtro.appendChild(option);
    });
}

/**
 * Abre modal de evento
 */
function abrirModalEvento() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Fecha modal de evento
 */
function fecharModalEvento() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('formEvento')?.reset();
    }
}

/**
 * Salva evento
 */
async function salvarEvento(e) {
    e.preventDefault();

    const form = e.target;
    const btnSubmit = form.querySelector('button[type="submit"]');
    const restaurarBotao = botaoLoading(btnSubmit, 'Salvando...');

    try {
        const dadosEvento = {
            nome: document.getElementById('eventoNome').value,
            data_evento: document.getElementById('eventoData').value,
            local: document.getElementById('eventoLocal').value,
            descricao: document.getElementById('eventoDescricao').value
        };

        const data = await criarEvento(dadosEvento);

        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            fecharModalEvento();
            carregarEventos();
        } else {
            mostrarErro(data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        mostrarErro('Erro ao salvar evento');
    } finally {
        restaurarBotao();
    }
}

// ============================================
// LISTA DE PRESENÇA
// ============================================

/**
 * ✅ NOVO: Busca dados por telefone AUTOMATICAMENTE (sem mostrar loading)
 * @param {string} telefone - Telefone já limpo (apenas números)
 */
async function buscarDadosPorTelefoneAutomatico(telefone) {
    try {
        const data = await buscarPorTelefone(telefone);

        if (data.sucesso && data.encontrado) {
            // Preencher campos automaticamente
            document.getElementById('inputNome').value = data.dados.nome_completo;
            document.getElementById('inputEmail').value = data.dados.email || '';
            
            // Feedback visual positivo
            mostrarMensagemCampo('✅ Dados encontrados!', 'sucesso');
        } else {
            // Limpar campos e mostrar mensagem informativa
            document.getElementById('inputNome').value = '';
            document.getElementById('inputEmail').value = '';
            
            // Mensagem amigável sem erro
            mostrarMensagemCampo('ℹ️ Cidadão não cadastrado. Preencha os dados manualmente.', 'info');
        }
    } catch (error) {
        console.error('Erro ao buscar telefone automaticamente:', error);
        // Não mostrar erro ao usuário para não atrapalhar digitação
    }
}

/**
 * ✅ NOVO: Mostra mensagem abaixo do campo de telefone
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - 'sucesso', 'info' ou 'erro'
 */
function mostrarMensagemCampo(mensagem, tipo = 'info') {
    // Remove mensagem anterior se existir
    const mensagemAnterior = document.querySelector('.mensagem-telefone');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Cria nova mensagem
    const divMensagem = document.createElement('div');
    divMensagem.className = `mensagem-telefone mensagem-${tipo}`;
    divMensagem.textContent = mensagem;
    
    // Insere depois do campo de telefone
    const inputGroup = document.querySelector('.input-with-button');
    inputGroup.parentNode.insertBefore(divMensagem, inputGroup.nextSibling);
    
    // Remove após 4 segundos
    setTimeout(() => {
        divMensagem.style.opacity = '0';
        setTimeout(() => divMensagem.remove(), 300);
    }, 4000);
}

/**
 * Busca dados por telefone (quando clicar no botão)
 */
async function buscarDadosPorTelefone() {
    const inputTelefone = document.getElementById('inputTelefone');
    const telefone = inputTelefone.value.replace(/\D/g, '');

    if (telefone.length < 10) {
        mostrarMensagemCampo('⚠️ Digite um telefone válido (10 ou 11 dígitos)', 'erro');
        return;
    }

    const btnBuscar = document.getElementById('btnBuscarTelefone');
    const restaurarBotao = botaoLoading(btnBuscar, 'Buscando...');

    try {
        const data = await buscarPorTelefone(telefone);

        if (data.sucesso && data.encontrado) {
            // Preencher campos automaticamente
            document.getElementById('inputNome').value = data.dados.nome_completo;
            document.getElementById('inputEmail').value = data.dados.email || '';
            
            const origem = data.origem === 'cidadao' ? 'Cadastrado como cidadão' : 'Presente em eventos anteriores';
            mostrarMensagemCampo(`✅ Dados encontrados! (${origem})`, 'sucesso');
        } else {
            // Limpar campos
            document.getElementById('inputNome').value = '';
            document.getElementById('inputEmail').value = '';
            
            // Mensagem amigável
            mostrarMensagemCampo('ℹ️ Cidadão não cadastrado. Preencha os dados manualmente.', 'info');
        }
    } catch (error) {
        console.error('Erro ao buscar telefone:', error);
        mostrarMensagemCampo('❌ Erro ao buscar telefone. Tente novamente.', 'erro');
    } finally {
        restaurarBotao();
    }
}

/**
 * Salva presença
 */
async function salvarPresenca(e) {
    e.preventDefault();

    const form = e.target;
    const btnSubmit = form.querySelector('button[type="submit"]');
    const restaurarBotao = botaoLoading(btnSubmit, 'Registrando...');

    try {
        const dadosPresenca = {
            evento_id: parseInt(document.getElementById('selectEvento').value),
            nome_completo: document.getElementById('inputNome').value,
            telefone: document.getElementById('inputTelefone').value.replace(/\D/g, ''),
            email: document.getElementById('inputEmail').value,
            observacoes: document.getElementById('inputObservacoes').value
        };

        if (!dadosPresenca.evento_id) {
            mostrarErro('Selecione um evento');
            restaurarBotao();
            return;
        }

        const data = await registrarPresenca(dadosPresenca);

        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            limparFormularioPresenca();
            carregarPresencas();
            atualizarEstatisticas();
        } else {
            mostrarErro(data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao registrar presença:', error);
        // Exibir a mensagem do erro (que vem do backend)
        mostrarErro(error.message || 'Erro ao registrar presença');
    } finally {
        restaurarBotao();
    }
}

/**
 * Limpa formulário de presença
 */
function limparFormularioPresenca() {
    document.getElementById('inputTelefone').value = '';
    document.getElementById('inputNome').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputObservacoes').value = '';
}

/**
 * Carrega lista de presenças
 * Agora trata erro 403 (sem permissão) de forma silenciosa para assessores externos
 */
async function carregarPresencas(eventoId = null) {
    try {
        // Tentar carregar a lista completa (apenas usuários com permissão conseguem)
        const data = await listarPresencas(eventoId);

        if (data.sucesso) {
            presencasCarregadas = data.presencas;
            renderizarTabelaPresencas(presencasCarregadas);
        }
    } catch (error) {
        // ✅ Se erro 403 (sem permissão), não mostra erro - é esperado para assessores externos
        if (error.message && error.message.includes('permissão')) {
            console.log('Usuário sem permissão para ver lista detalhada - modo somente visualização');
            presencasCarregadas = []; // Lista vazia
            // Não renderiza tabela nem mostra erro
        } else {
            // Outros erros são reportados
            console.error('Erro ao carregar presenças:', error);
            mostrarErro('Erro ao carregar presenças');
        }
    }
}

/**
 * Renderiza tabela de presenças
 */
function renderizarTabelaPresencas(presencas) {
    const tbody = document.getElementById('tabelaPresencas');
    const semDados = document.getElementById('semDados');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (presencas.length === 0) {
        if (semDados) semDados.style.display = 'block';
        return;
    }

    if (semDados) semDados.style.display = 'none';

    presencas.forEach(presenca => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${presenca.nome_completo}</td>
            <td>${formatarTelefoneExibicao(presenca.telefone)}</td>
            <td>${presenca.email || '-'}</td>
            <td>${presenca.usuarios?.nome_completo || 'Sistema'}</td>
            <td class="acoes-td">
                <button class="btn-acao-pequeno btn-excluir" onclick="window.excluirPresencaFunc(${presenca.id})" title="Excluir registro">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Formata telefone para exibição
 */
function formatarTelefoneExibicao(telefone) {
    if (!telefone) return '-';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    return telefone;
}

/**
 * Filtra presenças por evento e nome/telefone
 */
function filtrarPresencas() {
    const filtroEvento = document.getElementById('filtroEvento');
    const filtroNomeTelefone = document.getElementById('filtroNomeTelefone');
    
    const eventoId = filtroEvento?.value ? parseInt(filtroEvento.value) : null;
    const textoBusca = filtroNomeTelefone?.value.toLowerCase().trim() || '';

    // Primeiro carrega as presenças do evento (ou todas)
    carregarPresencas(eventoId).then(() => {
        // Se houver texto de busca, filtra localmente
        if (textoBusca) {
            const presencasFiltradas = presencasCarregadas.filter(presenca => {
                const nome = presenca.nome_completo.toLowerCase();
                const telefone = presenca.telefone.replace(/\D/g, '');
                const buscaLimpa = textoBusca.replace(/\D/g, '');
                
                return nome.includes(textoBusca) || telefone.includes(buscaLimpa);
            });
            
            renderizarTabelaPresencas(presencasFiltradas);
        }
    });
}

/**
 * Atualiza estatísticas
 * Agora usa as novas rotas de estatísticas acessíveis a todos
 */
async function atualizarEstatisticas() {
    const totalEventos = document.getElementById('totalEventos');
    const totalPresencas = document.getElementById('totalPresencas');
    const presencasEvento = document.getElementById('presencasEvento');

    // Atualizar total de eventos (sempre acessível)
    if (totalEventos) {
        totalEventos.textContent = eventosDisponiveis.length;
    }

    // Buscar total geral de presenças via API (acessível a todos)
    try {
        const dataGeral = await buscarEstatisticasGerais();
        if (dataGeral.sucesso && totalPresencas) {
            totalPresencas.textContent = dataGeral.total_presencas;
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas gerais:', error);
        if (totalPresencas) totalPresencas.textContent = '0';
    }

    // Buscar presenças do evento selecionado via API (acessível a todos)
    const eventoSelecionado = document.getElementById('selectEvento')?.value;
    if (eventoSelecionado && presencasEvento) {
        try {
            const dataEvento = await buscarContagemPorEvento(eventoSelecionado);
            if (dataEvento.sucesso) {
                presencasEvento.textContent = dataEvento.total_presencas;
            }
        } catch (error) {
            console.error('Erro ao buscar presenças do evento:', error);
            presencasEvento.textContent = '0';
        }
    } else if (presencasEvento) {
        presencasEvento.textContent = '0';
    }
}

/**
 * Exclui presença (disponível globalmente para onclick)
 */
window.excluirPresencaFunc = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este registro de presença?')) {
        return;
    }

    try {
        const data = await excluirPresenca(id);

        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            carregarPresencas();
        } else {
            mostrarErro(data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao excluir presença:', error);
        mostrarErro('Erro ao excluir presença');
    }
};

// ============================================
// EXPORTAÇÃO
// ============================================

/**
 * Exporta para Excel (em desenvolvimento)
 */
function exportarExcel() {
    mostrarAviso('⚠️ Funcionalidade de exportação para Excel em desenvolvimento');
    // TODO: Implementar exportação Excel usando biblioteca como SheetJS
}

/**
 * Exporta para PDF (em desenvolvimento)
 */
function exportarPDF() {
    mostrarAviso('⚠️ Funcionalidade de exportação para PDF em desenvolvimento');
    // TODO: Implementar exportação PDF usando biblioteca como jsPDF
}