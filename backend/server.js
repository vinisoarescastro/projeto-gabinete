import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testarConexao } from './config/supabase.js';
import demandasRoutes from './routes/demandasRoutes.js';

dotenv.config();

const app = express();
const PORT = 3000;

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
app.use('/api/demandas', demandasRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/`); 
});