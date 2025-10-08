/**
 * Configuração de Ambiente
 * Este arquivo detecta se está rodando local ou online
 */

// Detectar se está no seu computador (localhost) ou na internet
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// URLs da API
export const API_CONFIG = {
    // Quando estiver online, vai usar esta URL
    // ⬇️ VOCÊ VAI MUDAR ISSO DEPOIS!
    PRODUCTION: 'https://projeto-gabinete-api.onrender.com',
    
    // Quando estiver no seu computador
    DEVELOPMENT: 'http://localhost:3000'
};

// Escolhe automaticamente a URL certa
export const API_URL = isProduction ? API_CONFIG.PRODUCTION : API_CONFIG.DEVELOPMENT;

// Mostra no console qual ambiente está usando
console.log(`🌐 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
console.log(`📡 API URL: ${API_URL}`);