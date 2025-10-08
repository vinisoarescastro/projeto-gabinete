/**
 * Página de Gerenciamento de Usuários
 */

import { verificarAutenticacao, getUsuarioLogado } from '../utils/auth.js';
import { inicializarHeader } from '../components/header.js';
import { API_URL } from '../utils/constants.js';
import { getToken } from '../utils/auth.js';
import { formatarDataHora } from '../utils/formatters.js';

/**
 * Busca estatísticas de usuários
 */
async function carregarUsuarios() {
    const corpoTabela = document.getElementById('corpoTabelaUsuarios');
    
    try {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="6" class="carregando">Carregando usuários...</td>
            </tr>
        `;
        
        const token = getToken();
        const response = await fetch(`${API_URL}/api/usuarios/stats/acessos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            renderizarUsuarios(data.usuarios);
        } else {
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #dc3545; padding: 40px;">
                    Erro ao carregar usuários: ${error.message}
                </td>
            </tr>
        `;
    }
}

/**
 * Renderiza tabela de usuários
 */
function renderizarUsuarios(usuarios) {
    const corpoTabela = document.getElementById('corpoTabelaUsuarios');
    
    if (usuarios.length === 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    corpoTabela.innerHTML = usuarios.map(usuario => `
        <tr>
            <td><strong>${usuario.nome_completo}</strong></td>
            <td>${usuario.email}</td>
            <td>${criarBadgePermissao(usuario.nivel_permissao)}</td>
            <td>${criarBadgeStatusAcesso(usuario)}</td>
            <td>${usuario.ultimo_acesso ? formatarDataHora(usuario.ultimo_acesso) : 'Nunca acessou'}</td>
            <td>${criarTempoInativo(usuario.dias_sem_acessar)}</td>
        </tr>
    `).join('');
}

/**
 * Cria badge de permissão
 */
function criarBadgePermissao(permissao) {
    const nomes = {
        'administrador': 'Administrador',
        'chefe_gabinete': 'Chefe de Gabinete',
        'supervisor': 'Supervisor',
        'assessor_interno': 'Assessor Interno',
        'assessor_externo': 'Assessor Externo'
    };
    
    return `<span class="badge-permissao ${permissao}">${nomes[permissao] || permissao}</span>`;
}

/**
 * Cria badge de status de acesso
 */
function criarBadgeStatusAcesso(usuario) {
    const dias = usuario.dias_sem_acessar;
    
    let classe = 'nunca';
    let texto = usuario.status_acesso;
    
    if (dias === null) {
        classe = 'nunca';
    } else if (dias === 0) {
        classe = 'ativo';
    } else if (dias <= 7) {
        classe = 'recente';
    } else if (dias <= 30) {
        classe = 'inativo';
    } else {
        classe = 'muito-inativo';
    }
    
    return `<span class="badge-status-acesso ${classe}">${texto}</span>`;
}

/**
 * Cria indicador de tempo inativo
 */
function criarTempoInativo(dias) {
    if (dias === null) {
        return '<span class="tempo-inativo">-</span>';
    }
    
    let classe = 'ok';
    let texto = '';
    
    if (dias === 0) {
        texto = 'Hoje';
        classe = 'ok';
    } else if (dias === 1) {
        texto = '1 dia';
        classe = 'ok';
    } else if (dias <= 7) {
        texto = `${dias} dias`;
        classe = 'ok';
    } else if (dias <= 30) {
        texto = `${dias} dias`;
        classe = 'alerta';
    } else {
        const meses = Math.floor(dias / 30);
        texto = `${meses} mês(es)`;
        classe = 'critico';
    }
    
    return `<span class="tempo-inativo ${classe}">${texto}</span>`;
}

/**
 * Inicializa a página
 */
function inicializar() {
    // Verificar autenticação
    const usuario = verificarAutenticacao();
    
    // Verificar se tem permissão
    if (!['administrador', 'chefe_gabinete'].includes(usuario.nivel_permissao)) {
        alert('Você não tem permissão para acessar esta página');
        window.location.href = '/frontend/html/principal.html';
        return;
    }
    
    // Inicializar header
    inicializarHeader();
    
    // Carregar usuários
    carregarUsuarios();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);