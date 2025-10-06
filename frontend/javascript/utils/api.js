/**
 * Funções para requisições à API
 */

import { API_URL } from './constants.js';
import { getToken } from './auth.js';

/**
 * Gera headers para requisições
 */
function getHeaders(includeToken = true) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (includeToken) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

/**
 * Wrapper para fetch com tratamento de erros
 */
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

export async function login(email, senha) {
    return fetchAPI(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, senha })
    });
}

// ============================================
// DEMANDAS
// ============================================

/**
 * Lista todas as demandas
 * @returns {Promise<Object>}
 */
export async function listarDemandas() {
    return fetchAPI(`${API_URL}/api/demandas`, {
        headers: getHeaders()
    });
}

/**
 * Busca uma demanda específica por ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function buscarDemanda(id) {
    return fetchAPI(`${API_URL}/api/demandas/${id}`, {
        headers: getHeaders()
    });
}

/**
 * Cria nova demanda
 * @param {Object} dadosDemanda
 * @returns {Promise<Object>}
 */
export async function criarDemanda(dadosDemanda) {
    return fetchAPI(`${API_URL}/api/demandas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dadosDemanda)
    });
}

/**
 * Atualiza demanda completa
 * @param {number} id
 * @param {Object} dadosAtualizados
 * @returns {Promise<Object>}
 */
export async function atualizarDemanda(id, dadosAtualizados) {
    return fetchAPI(`${API_URL}/api/demandas/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dadosAtualizados)
    });
}

/**
 * Atualiza apenas o status da demanda
 * @param {number} id
 * @param {number} novoStatusId
 * @returns {Promise<Object>}
 */
export async function atualizarStatusDemanda(id, novoStatusId) {
    return fetchAPI(`${API_URL}/api/demandas/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status_id: novoStatusId })
    });
}

/**
 * Exclui uma demanda
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function excluirDemanda(id) {
    return fetchAPI(`${API_URL}/api/demandas/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
}

// ============================================
// CIDADÃOS
// ============================================

/**
 * Busca cidadão por telefone
 * @param {string} telefone
 * @returns {Promise<Object>}
 */
export async function buscarCidadaoPorTelefone(telefone) {
    return fetchAPI(`${API_URL}/api/cidadaos/telefone/${telefone}`, {
        headers: getHeaders()
    });
}

/**
 * Cria novo cidadão
 * @param {Object} dadosCidadao
 * @returns {Promise<Object>}
 */
export async function criarCidadao(dadosCidadao) {
    return fetchAPI(`${API_URL}/api/cidadaos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dadosCidadao)
    });
}

// ============================================
// STATUS
// ============================================

/**
 * Lista todos os status
 * @returns {Promise<Object>}
 */
export async function listarStatus() {
    return fetchAPI(`${API_URL}/api/status`, {
        headers: getHeaders()
    });
}

/**
 * Cria novo status
 * @param {Object} dadosStatus
 * @returns {Promise<Object>}
 */
export async function criarStatus(dadosStatus) {
    return fetchAPI(`${API_URL}/api/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dadosStatus)
    });
}

/**
 * Atualiza status
 * @param {number} id
 * @param {Object} dadosStatus
 * @returns {Promise<Object>}
 */
export async function atualizarStatus(id, dadosStatus) {
    return fetchAPI(`${API_URL}/api/status/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dadosStatus)
    });
}

/**
 * Exclui status
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function excluirStatus(id) {
    return fetchAPI(`${API_URL}/api/status/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
}

// ============================================
// USUÁRIOS
// ============================================

/**
 * Lista todos os usuários ativos
 * @returns {Promise<Object>}
 */
export async function listarUsuarios() {
    return fetchAPI(`${API_URL}/api/usuarios`, {
        headers: getHeaders()
    });
}

// ============================================
// COMENTÁRIOS
// ============================================

/**
 * Lista comentários de uma demanda
 * @param {number} demandaId
 * @returns {Promise<Object>}
 */
export async function listarComentarios(demandaId) {
    return fetchAPI(`${API_URL}/api/comentarios/demanda/${demandaId}`, {
        headers: getHeaders()
    });
}

/**
 * Cria novo comentário
 * @param {number} demandaId
 * @param {string} comentario
 * @returns {Promise<Object>}
 */
export async function criarComentario(demandaId, comentario) {
    return fetchAPI(`${API_URL}/api/comentarios`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ demanda_id: demandaId, comentario })
    });
}

/**
 * Exclui comentário
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function excluirComentario(id) {
    return fetchAPI(`${API_URL}/api/comentarios/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
}