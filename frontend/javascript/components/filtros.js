/**
 * Componente de Filtros para Demandas
 * Gerencia filtros de status, prioridade, busca e datas
 */

/**
 * Aplica filtros a uma lista de demandas
 * @param {Array} demandas - Array de demandas
 * @param {Object} filtros - Objeto com os filtros ativos
 * @returns {Array} Demandas filtradas
 */
export function aplicarFiltros(demandas, filtros) {
    return demandas.filter(demanda => {
        // Filtro de status
        if (filtros.status && demanda.status_id !== parseInt(filtros.status)) {
            return false;
        }
        
        // Filtro de prioridade
        if (filtros.prioridade && demanda.prioridade !== filtros.prioridade) {
            return false;
        }
        
        // Filtro de busca (título ou nome do cidadão)
        if (filtros.busca) {
            const buscaLower = filtros.busca.toLowerCase();
            const tituloMatch = demanda.titulo.toLowerCase().includes(buscaLower);
            const cidadaoMatch = (demanda.cidadaos?.nome_completo || '').toLowerCase().includes(buscaLower);
            
            if (!tituloMatch && !cidadaoMatch) {
                return false;
            }
        }
        
        // Filtro de data inicial
        if (filtros.dataInicio) {
            const dataInicio = new Date(filtros.dataInicio + 'T00:00:00');
            const dataDemanda = new Date(demanda.criado_em);
            
            if (dataDemanda < dataInicio) {
                return false;
            }
        }
        
        // Filtro de data final
        if (filtros.dataFim) {
            const dataFim = new Date(filtros.dataFim + 'T23:59:59');
            const dataDemanda = new Date(demanda.criado_em);
            
            if (dataDemanda > dataFim) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Obtém valores dos filtros do DOM
 * @returns {Object} Objeto com os valores dos filtros
 */
export function obterFiltrosAtivos() {
    return {
        status: document.getElementById('filtroStatus')?.value || '',
        prioridade: document.getElementById('filtroPrioridade')?.value || '',
        busca: document.getElementById('filtroBusca')?.value.toLowerCase() || '',
        dataInicio: document.getElementById('filtroDataInicio')?.value || '',
        dataFim: document.getElementById('filtroDataFim')?.value || ''
    };
}

/**
 * Limpa todos os filtros
 */
export function limparFiltros() {
    const campos = [
        'filtroStatus',
        'filtroPrioridade',
        'filtroBusca',
        'filtroDataInicio',
        'filtroDataFim'
    ];
    
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = '';
        }
    });
}

/**
 * Inicializa os eventos dos filtros
 * @param {Function} callback - Função a ser chamada quando filtros mudarem
 */
export function inicializarFiltros(callback) {
    // Filtros de select
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroPrioridade = document.getElementById('filtroPrioridade');
    
    if (filtroStatus) {
        filtroStatus.addEventListener('change', callback);
    }
    
    if (filtroPrioridade) {
        filtroPrioridade.addEventListener('change', callback);
    }
    
    // Filtro de busca (com debounce para performance)
    const filtroBusca = document.getElementById('filtroBusca');
    if (filtroBusca) {
        let timeoutId;
        filtroBusca.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(callback, 300); // Espera 300ms após parar de digitar
        });
    }
    
    // Filtros de data
    const filtroDataInicio = document.getElementById('filtroDataInicio');
    const filtroDataFim = document.getElementById('filtroDataFim');
    
    if (filtroDataInicio) {
        filtroDataInicio.addEventListener('change', callback);
    }
    
    if (filtroDataFim) {
        filtroDataFim.addEventListener('change', callback);
    }
    
    // Botão limpar filtros
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            limparFiltros();
            callback();
        });
    }
}