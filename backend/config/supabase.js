import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Criando cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar conexão
export const testarConexao = async () => {
    try {
        const { data, error } = await supabase.from('status').select('*').limit(1);
        if (error) throw error;
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com Supabase:', error.message);
        return false;
    }
};