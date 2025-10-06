/**
 * Funções para cálculo de estatísticas de demandas
 */

/**
 * Calcula estatísticas gerais das demandas
 * @param {Array} demandas - Array de demandas
 * @returns {Object} Objeto com as estatísticas
 */
export function calcularEstatisticasGerais(demandas) {
    return {
        total: demandas.length,
        pendentes: demandas.filter(d => d.status_id >= 1 && d.status_id <= 3).length,
        concluidas: demandas.filter(d => d.status_id === 4).length,
        arquivadas: demandas.filter(d => d.status_id === 5).length
    };
}

/**
 * Calcula estatísticas de demandas de um usuário específico
 * @param {Array} demandas - Array de demandas
 * @param {number} usuarioId - ID do usuário
 * @returns {Object} Objeto com estatísticas do usuário
 */
export function calcularEstatisticasUsuario(demandas, usuarioId) {
    const demandasUsuario = demandas.filter(d => d.usuario_responsavel_id === usuarioId);
    
    return {
        aFazer: demandasUsuario.filter(d => d.status_id === 1).length,
        emProgresso: demandasUsuario.filter(d => d.status_id === 2 || d.status_id === 3).length,
        concluidas: demandasUsuario.filter(d => d.status_id === 4).length,
        total: demandasUsuario.length
    };
}

/**
 * Calcula estatísticas por prioridade
 * @param {Array} demandas
 * @returns {Object}
 */
export function calcularEstatisticasPorPrioridade(demandas) {
    return {
        urgente: demandas.filter(d => d.prioridade === 'urgente').length,
        alta: demandas.filter(d => d.prioridade === 'alta').length,
        media: demandas.filter(d => d.prioridade === 'media').length,
        baixa: demandas.filter(d => d.prioridade === 'baixa').length
    };
}