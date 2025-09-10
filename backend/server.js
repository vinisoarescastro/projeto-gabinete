import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
console.log('URL do Supabase: ', process.env.SUPABASE_URL);
console.log('Chave carregada: ', process.env.SUPABASE_ANON_KEY ? 'SIM' : 'NÃO');

const app = express();  // criando aplicação express

const PORT = 3000;      // definição da porta onde o servidor vai rodar

// Configurações do servidor
app.use(cors());        // permite que o front e back conversem
app.use(express.json());// permite receber dados em json

// primeira rota - teste básico
app.get('/', (req, res) => {
    res.json({ message: 'Backend funcionando com ES Modules'}); 
}); 

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/`); 
})