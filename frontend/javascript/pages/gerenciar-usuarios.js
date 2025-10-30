/**
 * Página de Gerenciamento de Usuários
 */

import { verificarAutenticacao, getUsuarioLogado } from '../utils/auth.js';
import { renderizarHeader } from '../components/layout-header.js';
import { renderizarNav } from '../components/layout-nav.js';
import { API_URL } from '../utils/constants.js';
import { getToken } from '../utils/auth.js';
import { formatarDataHora, formatarTempoRelativo } from '../utils/formatters.js';
import { 
    criarUsuario, 
    atualizarUsuario, 
    alterarStatusUsuario, 
    resetarSenhaUsuario 
} from '../utils/api.js';
import { mostrarErro, mostrarSucesso, botaoLoading } from '../utils/notifications.js';

let usuarioEmEdicao = null;

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
    const usuarioLogado = getUsuarioLogado();
    
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
            <td>
                ${usuario.ativo ? 
                    '<span class="badge-ativo">✅ Ativo</span>' : 
                    '<span class="badge-inativo">❌ Inativo</span>'
                }
            </td>
            <td>${formatarTempoRelativo(usuario.ultimo_acesso)}</td>
            <td>
                <div class="btn-acoes-icones">
                    <button class="btn-icone btn-editar" 
                            onclick="window.editarUsuario(${usuario.id})" 
                            title="Editar usuário">
                        ✏️
                    </button>
                    <button class="btn-icone btn-resetar" 
                            onclick="window.resetarSenha(${usuario.id}, '${usuario.nome_completo.replace(/'/g, "\\'")}\')" 
                            title="Resetar senha">
                        🔑
                    </button>
                    ${usuario.id !== usuarioLogado.id ? `
                        ${usuario.ativo ? `
                            <button class="btn-icone btn-desativar" 
                                    onclick="window.toggleStatusUsuario(${usuario.id}, false, '${usuario.nome_completo.replace(/'/g, "\\'")}')" 
                                    title="Desativar usuário">
                                🚫
                            </button>
                        ` : `
                            <button class="btn-icone btn-ativar" 
                                    onclick="window.toggleStatusUsuario(${usuario.id}, true, '${usuario.nome_completo.replace(/'/g, "\\'")}')" 
                                    title="Ativar usuário">
                                ✅
                            </button>
                        `}
                    ` : '<small style="color: #6c757d;">Você</small>'}
                </div>
            </td>
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
 * Abre modal para novo usuário
 */
function abrirModalNovoUsuario() {
    usuarioEmEdicao = null;
    
    document.getElementById('tituloModalUsuario').textContent = 'Novo Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('senhaUsuario').value = 'Senha123!';
    document.getElementById('grupoSenha').style.display = 'block';
    
    const modal = document.getElementById('modalUsuario');
    modal.style.display = 'block';
}

/**
 * Edita usuário existente
 */
async function editarUsuario(id) {
    usuarioEmEdicao = id;
    
    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            const usuario = data.usuario;
            
            document.getElementById('tituloModalUsuario').textContent = 'Editar Usuário';
            document.getElementById('usuarioId').value = usuario.id;
            document.getElementById('nomeCompleto').value = usuario.nome_completo;
            document.getElementById('emailUsuario').value = usuario.email;
            document.getElementById('nivelPermissao').value = usuario.nivel_permissao;
            document.getElementById('grupoSenha').style.display = 'none'; // Ocultar campo senha na edição
            
            const modal = document.getElementById('modalUsuario');
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar dados do usuário');
    }
}

/**
 * Fecha modal de usuário
 */
function fecharModalUsuario() {
    const modal = document.getElementById('modalUsuario');
    modal.style.display = 'none';
    usuarioEmEdicao = null;
}

/**
 * Salva usuário (criar ou editar)
 */
async function salvarUsuario(e) {
    e.preventDefault();
    
    const nomeCompleto = document.getElementById('nomeCompleto').value;
    const email = document.getElementById('emailUsuario').value;
    const nivelPermissao = document.getElementById('nivelPermissao').value;
    const senha = document.getElementById('senhaUsuario').value;
    
    const btnSalvar = document.querySelector('#formUsuario .btn-salvar');
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    
    try {
        let data;
        
        if (usuarioEmEdicao) {
            // Editar
            data = await atualizarUsuario(usuarioEmEdicao, {
                nome_completo: nomeCompleto,
                email,
                nivel_permissao: nivelPermissao
            });
        } else {
            // Criar novo
            data = await criarUsuario({
                nome_completo: nomeCompleto,
                email,
                senha,
                nivel_permissao: nivelPermissao
            });
        }
        
        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            fecharModalUsuario();
            await carregarUsuarios();
        } else {
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao salvar usuário');
    } finally {
        // ⬅️ CORREÇÃO: Sempre restaurar o botão
        btnSalvar.disabled = false;
        btnSalvar.textContent = textoOriginal;
    }
}

/**
 * Resetar senha do usuário
 */
async function resetarSenha(id, nome) {
    if (!confirm(`Resetar senha de "${nome}"?\n\nA senha será alterada para: Senha123!\n\nO usuário precisará trocar no próximo login.`)) {
        return;
    }
    
    try {
        const data = await resetarSenhaUsuario(id);
        
        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
        } else {
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao resetar senha');
    }
}

/**
 * Ativar/Desativar usuário
 */
async function toggleStatusUsuario(id, novoStatus, nome) {
    const acao = novoStatus ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${acao} o usuário "${nome}"?`)) {
        return;
    }
    
    try {
        const data = await alterarStatusUsuario(id, novoStatus);
        
        if (data.sucesso) {
            mostrarSucesso(data.mensagem);
            await carregarUsuarios();
        } else {
            throw new Error(data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao alterar status');
    }
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
    
    renderizarHeader('header-container'); // ✅ Cria O HTML + preenche dados
    renderizarNav('nav-container');       // ✅ Cria o HTML do menu
    
    // Carregar usuários
    carregarUsuarios();
    
    // Event listeners
    const btnNovoUsuario = document.getElementById('btnNovoUsuario');
    if (btnNovoUsuario) {
        btnNovoUsuario.addEventListener('click', abrirModalNovoUsuario);
    }
    
    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', salvarUsuario);
    }
    
    // Expor funções globalmente
    window.editarUsuario = editarUsuario;
    window.fecharModalUsuario = fecharModalUsuario;
    window.resetarSenha = resetarSenha;
    window.toggleStatusUsuario = toggleStatusUsuario;
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalUsuario');
        if (event.target === modal) {
            fecharModalUsuario();
        }
    });
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializar);