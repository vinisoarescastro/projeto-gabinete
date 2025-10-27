import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testarConexao } from './config/supabase.js';
import demandasRoutes from './routes/demandasRoutes.js';
import authRoutes from './routes/authRoutes.js';
import comentariosRoutes from './routes/comentariosRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import cidadaosRoutes from './routes/cidadaosRoutes.js';
import eventosRoutes from './routes/eventosRoutes.js';
import listaPresencaRoutes from './routes/listaPresencaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do servidor
app.use(cors());
app.use(express.json());

// Testar conexão com Supabase ao iniciar o servidor
testarConexao();

// Rota de teste básico
app.get('/', (req, res) => {
    res.json({ message: 'API do Sistema Kanban - Backend funcionando!'}); 
}); 

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/demandas', demandasRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cidadaos', cidadaosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/lista-presenca', listaPresencaRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta: ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});