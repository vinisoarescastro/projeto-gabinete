/**
 * Componente de Modal de Detalhes da Demanda
 * Exibe informações completas e sistema de comentários
 */

import { buscarDemanda, listarComentarios, criarComentario, excluirComentario } from '../utils/api.js';
import { formatarDataHora, formatarTextoComQuebras } from '../utils/formatters.js';
import { mostrarErro, mostrarSucesso } from '../utils/notifications.js';
import { getUsuarioLogado, podeExcluirComentario } from '../utils/auth.js';

let demandaAtualId = null;

/**
 * Abre modal de detalhes
 * @param {number} id - ID da demanda
 */
export async function abrirModalDetalhes(id) {
    demandaAtualId = id;
    const usuario = getUsuarioLogado();
    
    try {
        const data = await buscarDemanda(id);
        
        if (data.sucesso) {
            const demanda = data.demanda;
            preencherDadosGerais(demanda);
            preencherDadosCidadao(demanda);
            preencherDadosResponsaveis(demanda);
            configurarBotaoEditar(demanda, usuario);
            mostrarModal();
            
            // Carregar comentários
            await carregarComentarios(id);
        } else {
            mostrarErro('Erro ao carregar detalhes da demanda');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar detalhes');
    }
}

/**
 * Preenche dados gerais da demanda
 */
function preencherDadosGerais(demanda) {
    document.getElementById('detTitulo').textContent = demanda.titulo;
    document.getElementById('detPrioridade').innerHTML = `<span class="badge prioridade-${demanda.prioridade}">${demanda.prioridade}</span>`;
    document.getElementById('detStatus').innerHTML = `<span class="badge status-${demanda.status_id}">${demanda.status?.nome || 'N/A'}</span>`;
    document.getElementById('detDescricao').innerHTML = formatarTextoComQuebras(demanda.descricao);
}

/**
 * Preenche dados do cidadão
 */
function preencherDadosCidadao(demanda) {
    document.getElementById('detCidadaoNome').textContent = demanda.cidadaos?.nome_completo || 'N/A';
    document.getElementById('detCidadaoTelefone').textContent = demanda.cidadaos?.telefone || 'N/A';
    document.getElementById('detCidadaoCidade').textContent = `${demanda.cidadaos?.bairro || 'N/A'}, ${demanda.cidadaos?.cidade || 'N/A'}/${demanda.cidadaos?.estado || 'N/A'}`;
    document.getElementById('detCidadaoEmail').textContent = demanda.cidadaos?.email || 'Não informado';
}

/**
 * Preenche dados dos responsáveis
 */
function preencherDadosResponsaveis(demanda) {
    document.getElementById('detResponsavel').textContent = demanda.usuario_responsavel?.nome_completo || 'N/A';
    document.getElementById('detOrigem').textContent = demanda.usuario_origem?.nome_completo || 'N/A';
    document.getElementById('detDataCriacao').textContent = formatarDataHora(demanda.criado_em);
    document.getElementById('detDataAtualizacao').textContent = formatarDataHora(demanda.atualizado_em);
}

/**
 * Configura botão de editar
 */
function configurarBotaoEditar(demanda, usuario) {
    const btnEditar = document.getElementById('btnEditarDetalhes');
    
    if (!btnEditar) return;
    
    const podeEditar = 
        usuario.nivel_permissao === 'administrador' ||
        usuario.nivel_permissao === 'chefe_gabinete' ||
        usuario.nivel_permissao === 'supervisor' ||
        demanda.usuario_responsavel_id === usuario.id;
    
    if (podeEditar) {
        btnEditar.style.display = 'inline-block';
        btnEditar.onclick = () => {
            fecharModalDetalhes();
            if (window.abrirModalEdicao) {
                window.abrirModalEdicao(demanda.id);
            }
        };
    } else {
        btnEditar.style.display = 'none';
    }
}

/**
 * Carrega comentários da demanda
 */
async function carregarComentarios(demandaId) {
    const listaComentarios = document.getElementById('listaComentarios');
    const usuario = getUsuarioLogado();
    
    if (!listaComentarios) {
        console.warn('Elemento listaComentarios não encontrado');
        return;
    }
    
    try {
        listaComentarios.innerHTML = '<p class="carregando">Carregando comentários...</p>';
        
        const data = await listarComentarios(demandaId);
        
        if (data.sucesso) {
            if (data.comentarios.length === 0) {
                listaComentarios.innerHTML = '<p class="sem-comentarios">Nenhum comentário ainda</p>';
            } else {
                listaComentarios.innerHTML = data.comentarios.map(c => {
                    const podeExcluir = podeExcluirComentario(usuario, c);
                    
                    return `
                        <div class="comentario-item">
                            <div class="comentario-header">
                                <span class="comentario-autor">${c.usuarios?.nome_completo || 'Usuário'}</span>
                                <div>
                                    <span class="comentario-data">${formatarDataHora(c.criado_em)}</span>
                                    ${podeExcluir ? `<button class="btn-excluir-comentario" onclick="window.excluirComentarioGlobal(${c.id})" title="Excluir comentário">🗑️</button>` : ''}
                                </div>
                            </div>
                            <div class="comentario-texto">${c.comentario}</div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            listaComentarios.innerHTML = '<p class="erro">Erro ao carregar comentários</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        listaComentarios.innerHTML = '<p class="erro">Erro ao carregar comentários</p>';
    }
}

/**
 * Adiciona novo comentário
 */
export async function adicionarComentario() {
    if (!demandaAtualId) {
        mostrarErro('Erro: demanda não identificada');
        return;
    }
    
    const textarea = document.getElementById('novoComentario');
    const comentario = textarea?.value?.trim();
    
    if (!comentario) {
        mostrarErro('Digite um comentário');
        return;
    }
    
    try {
        const data = await criarComentario(demandaAtualId, comentario);
        
        if (data.sucesso) {
            textarea.value = '';
            await carregarComentarios(demandaAtualId);
            mostrarSucesso('Comentário adicionado com sucesso!');
        } else {
            mostrarErro('Erro ao adicionar comentário');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao adicionar comentário');
    }
}

/**
 * Exclui comentário
 */
export async function excluirComentarioModal(id) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }
    
    try {
        const data = await excluirComentario(id);
        
        if (data.sucesso) {
            await carregarComentarios(demandaAtualId);
            mostrarSucesso('Comentário excluído com sucesso!');
        } else {
            mostrarErro('Erro: ' + data.mensagem);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao excluir comentário');
    }
}

/**
 * Mostra o modal
 */
function mostrarModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Fecha o modal
 */
export function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.style.display = 'none';
    }
    
    demandaAtualId = null;
}

/**
 * Inicializa eventos do modal
 */
export function inicializarModalDetalhes() {
    // Botão fechar
    const closeDetalhes = document.querySelector('.close-detalhes');
    if (closeDetalhes) {
        closeDetalhes.addEventListener('click', fecharModalDetalhes);
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalDetalhes');
        if (event.target === modal) {
            fecharModalDetalhes();
        }
    });
}