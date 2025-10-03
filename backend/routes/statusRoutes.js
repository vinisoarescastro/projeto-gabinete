import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota GET - Listar todos os status ativos
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('status')
            .select('*')
            .eq('ativo', true)
            .order('ordem', { ascending: true });

        if (error) throw error;

        res.json({
            sucesso: true,
            quantidade: data.length,
            status: data
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar status',
            erro: error.message
        });
    }
});

// Rota POST - Criar novo status
router.post('/', verificarToken, async (req, res) => {
    try {
        const { nome, ordem } = req.body;
        const usuarioLogado = req.usuario;

        // Verificar permissões (apenas admin, chefe_gabinete e supervisor)
        if (!['administrador', 'chefe_gabinete', 'supervisor'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para criar status'
            });
        }

        // Validação
        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome do status é obrigatório'
            });
        }

        // Se não informou ordem, pegar a próxima disponível
        let ordemFinal = ordem;
        if (!ordemFinal) {
            const { data: ultimoStatus } = await supabase
                .from('status')
                .select('ordem')
                .order('ordem', { ascending: false })
                .limit(1)
                .single();
            
            ordemFinal = ultimoStatus ? ultimoStatus.ordem + 1 : 1;
        }

        const { data, error } = await supabase
            .from('status')
            .insert([{
                nome,
                ordem: ordemFinal,
                ativo: true
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            sucesso: true,
            mensagem: 'Status criado com sucesso!',
            status: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar status',
            erro: error.message
        });
    }
});

// Rota PUT - Atualizar status
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, ordem } = req.body;
        const usuarioLogado = req.usuario;

        // Verificar permissões
        if (!['administrador', 'chefe_gabinete', 'supervisor'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para editar status'
            });
        }

        // Validação
        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome do status é obrigatório'
            });
        }

        const { data, error } = await supabase
            .from('status')
            .update({ nome, ordem })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Status não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Status atualizado com sucesso!',
            status: data[0]
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar status',
            erro: error.message
        });
    }
});

// Rota DELETE - Excluir status
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioLogado = req.usuario;

        // Verificar permissões
        if (!['administrador', 'chefe_gabinete', 'supervisor'].includes(usuarioLogado.nivel_permissao)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para excluir status'
            });
        }

        // Buscar o status
        const { data: statusData, error: erroStatus } = await supabase
            .from('status')
            .select('id, nome, ordem')
            .eq('id', id)
            .single();

        if (erroStatus || !statusData) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Status não encontrado'
            });
        }

        // Verificar se é Caixa de Entrada (ordem 1) ou Arquivado (ordem 5)
        if (statusData.ordem === 1 || statusData.ordem === 5) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não é possível excluir os status "Caixa de Entrada" e "Arquivado"'
            });
        }

        // Verificar se tem demandas neste status
        const { data: demandas, error: erroDemandas } = await supabase
            .from('demandas')
            .select('id')
            .eq('status_id', id)
            .limit(1);

        if (erroDemandas) throw erroDemandas;

        if (demandas && demandas.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não é possível excluir um status que possui demandas. Mova ou exclua as demandas primeiro.'
            });
        }

        // Excluir o status
        const { error } = await supabase
            .from('status')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            sucesso: true,
            mensagem: 'Status excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir status',
            erro: error.message
        });
    }
});

export default router;