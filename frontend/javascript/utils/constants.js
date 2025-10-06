/**
 * Constantes globais da aplicação
 * Centraliza valores que são usados em vários lugares
 */

// URL base da API
export const API_URL = 'http://localhost:3000';

// Prioridades de demandas
export const PRIORIDADES = {
    URGENTE: 'urgente',
    ALTA: 'alta',
    MEDIA: 'media',
    BAIXA: 'baixa'
};

// Níveis de permissão
export const NIVEIS_PERMISSAO = {
    ADMIN: 'administrador',
    CHEFE: 'chefe_gabinete',
    SUPERVISOR: 'supervisor',
    ASSESSOR_INTERNO: 'assessor_interno',
    ASSESSOR_EXTERNO: 'assessor_externo'
};

// Paginação
export const CARDS_POR_PAGINA = 8;

// Cores dos avatares
export const CORES_AVATAR = 5;