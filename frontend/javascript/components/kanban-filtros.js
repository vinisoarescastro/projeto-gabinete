/**
 * Componente de Filtros do Kanban
 * Gerencia filtro de visualização (todas/minhas demandas)
 */

import { getUsuarioLogado } from '../utils/auth.js';

/**
 * Aplica filtro de visualização
 * @param {Array} todasDemandas
 * @param {string} filtro - 'todas' ou 'minhas'
 * @returns {Array}
 */
export function aplicarFiltroVisualizacao(todasDemandas, filtro) {
    if (filtro === 'minhas') {
        const usuario = getUsuarioLogado();
        return todasDemandas.filter(d => d.usuario_responsavel_id === usuario.id);
    }
    
    return todasDemandas;
}

/**
 * Obtém filtro ativo
 * @returns {string}
 */
export function obterFiltroAtivo() {
    const select = document.getElementById('filtroVisualizacao');
    return select ? select.value : 'todas';
}

/**
 * Inicializa eventos do filtro
 * @param {Function} callback
 */
export function inicializarFiltroKanban(callback) {
    const filtroVisualizacao = document.getElementById('filtroVisualizacao');
    
    if (filtroVisualizacao) {
        filtroVisualizacao.addEventListener('change', callback);
    }
}