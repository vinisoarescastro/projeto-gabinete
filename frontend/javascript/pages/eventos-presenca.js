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
    excluirPresenca 
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
    
    // Aplicar máscara de telefone
    const inputTelefone = document.getElementById('inputTelefone');
    inputTelefone.addEventListener('input', (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
    });
});

// Função removida - usando inicializarHeader() do componente


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

    // Botão buscar telefone
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

    // Botões de exportação
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

    if (temPermissao) {
        if (secaoLista) secaoLista.style.display = 'block';
        carregarPresencas();
    } else {
        if (secaoLista) secaoLista.style.display = 'none';
    }

    // Apenas Admin, Chefe de Gabinete, Supervisor e Assessor Interno podem criar eventos
    const podeCriarEvento = ['administrador', 'chefe_gabinete', 'supervisor', 'assessor_interno'].includes(
        usuarioLogado.nivel_permissao
    );
    if (!podeCriarEvento && btnNovoEvento) {
        btnNovoEvento.style.display = 'none';
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
            atualizarEstatisticas();
            
            // Selecionar último evento automaticamente
            await selecionarUltimoEvento();
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        mostrarErro('Erro ao carregar eventos');
    }
}

/**
 * Preenche os selects de evento
 */
function preencherSelectEventos() {
    const selectEvento = document.getElementById('selectEvento');
    const filtroEvento = document.getElementById('filtroEvento');

    if (selectEvento) {
        selectEvento.innerHTML = '<option value="">Selecione um evento</option>';
        eventosDisponiveis.forEach(evento => {
            const option = document.createElement('option');
            option.value = evento.id;
            option.textContent = `${evento.nome} - ${new Date(evento.data_evento).toLocaleDateString('pt-BR')}`;
            selectEvento.appendChild(option);
        });
    }

    if (filtroEvento) {
        filtroEvento.innerHTML = '<option value="">Todos os eventos</option>';
        eventosDisponiveis.forEach(evento => {
            const option = document.createElement('option');
            option.value = evento.id;
            option.textContent = `${evento.nome} - ${new Date(evento.data_evento).toLocaleDateString('pt-BR')}`;
            filtroEvento.appendChild(option);
        });
    }
}

/**
 * Seleciona automaticamente o último evento cadastrado
 */
async function selecionarUltimoEvento() {
    try {
        const data = await buscarUltimoEvento();
        
        if (data.sucesso && data.evento) {
            const selectEvento = document.getElementById('selectEvento');
            if (selectEvento) {
                selectEvento.value = data.evento.id;
            }
        }
    } catch (error) {
        console.error('Erro ao buscar último evento:', error);
    }
}

/**
 * Abre modal para criar/editar evento
 */
function abrirModalEvento() {
    const modal = document.getElementById('modalEvento');
    const titulo = document.getElementById('modalEventoTitulo');
    
    if (titulo) titulo.textContent = 'Novo Evento';
    limparFormularioEvento();
    
    if (modal) modal.classList.add('show');
}

/**
 * Fecha modal de evento
 */
function fecharModalEvento() {
    const modal = document.getElementById('modalEvento');
    if (modal) modal.classList.remove('show');
    limparFormularioEvento();
}

/**
 * Limpa formulário de evento
 */
function limparFormularioEvento() {
    document.getElementById('eventoId').value = '';
    document.getElementById('eventoNome').value = '';
    document.getElementById('eventoData').value = '';
    document.getElementById('eventoLocal').value = '';
    document.getElementById('eventoDescricao').value = '';
}

/**
 * Salva evento (criar ou editar)
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
 * Busca dados por telefone
 */
async function buscarDadosPorTelefone() {
    const inputTelefone = document.getElementById('inputTelefone');
    const telefone = inputTelefone.value.replace(/\D/g, '');

    if (telefone.length < 10) {
        mostrarAviso('Digite um telefone válido');
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
            
            mostrarSucesso(`Dados encontrados! ${data.origem === 'cidadao' ? '(Cadastrado como cidadão)' : '(Presente em eventos anteriores)'}`);
        } else {
            mostrarAviso('Telefone não encontrado. Preencha os dados manualmente.');
        }
    } catch (error) {
        console.error('Erro ao buscar telefone:', error);
        mostrarErro('Erro ao buscar telefone');
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
 */
async function carregarPresencas(eventoId = null) {
    try {
        const data = await listarPresencas(eventoId);

        if (data.sucesso) {
            presencasCarregadas = data.presencas;
            renderizarTabelaPresencas(presencasCarregadas);
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar presenças:', error);
        mostrarErro('Erro ao carregar presenças');
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
            <td>${presenca.eventos?.nome || 'N/A'}</td>
            <td>${presenca.nome_completo}</td>
            <td>${formatarTelefoneExibicao(presenca.telefone)}</td>
            <td>${presenca.email || '-'}</td>
            <td>${formatarDataHora(presenca.criado_em)}</td>
            <td>${presenca.usuarios?.nome_completo || 'Sistema'}</td>
            <td class="acoes-td">
                <button class="btn btn-danger btn-small" onclick="window.excluirPresencaFunc(${presenca.id})">
                    🗑️ Excluir
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
 * Filtra presenças por evento
 */
function filtrarPresencas() {
    const filtroEvento = document.getElementById('filtroEvento');
    const eventoId = filtroEvento?.value ? parseInt(filtroEvento.value) : null;
    
    carregarPresencas(eventoId);
}

/**
 * Atualiza estatísticas
 */
function atualizarEstatisticas() {
    const totalEventos = document.getElementById('totalEventos');
    const totalPresencas = document.getElementById('totalPresencas');
    const presencasEvento = document.getElementById('presencasEvento');

    if (totalEventos) totalEventos.textContent = eventosDisponiveis.length;
    if (totalPresencas) totalPresencas.textContent = presencasCarregadas.length;

    // Calcular presenças do evento selecionado
    const eventoSelecionado = document.getElementById('selectEvento')?.value;
    if (eventoSelecionado && presencasEvento) {
        const count = presencasCarregadas.filter(p => p.evento_id == eventoSelecionado).length;
        presencasEvento.textContent = count;
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
 * Exporta para Excel
 */
function exportarExcel() {
    mostrarAviso('Funcionalidade de exportação em desenvolvimento');
    // TODO: Implementar exportação Excel usando biblioteca como SheetJS
}

/**
 * Exporta para PDF
 */
function exportarPDF() {
    mostrarAviso('Funcionalidade de exportação em desenvolvimento');
    // TODO: Implementar exportação PDF usando biblioteca como jsPDF
}