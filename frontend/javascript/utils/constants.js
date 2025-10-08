/**
 * Constantes globais da aplicação
 */

// Importar URL da API do arquivo de configuração
import { API_URL as ENV_API_URL } from '../config.js';

// URL base da API (agora vem automaticamente do config.js)
export const API_URL = ENV_API_URL;

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