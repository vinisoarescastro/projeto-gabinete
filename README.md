# 🚀 Guia de Configuração do Ambiente

Este documento contém as instruções para configurar o ambiente de desenvolvimento do Sistema de Gestão de Gabinete.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git instalado

## 🔧 Configuração Passo a Passo

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd nome-do-projeto
```

### 2. Instalar Dependências

```bash
cd backend
npm install
```

### 3. Configurar Variáveis de Ambiente

#### 3.1. Criar arquivo .env

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

#### 3.2. Obter Credenciais do Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

#### 3.3. Gerar JWT Secret

Use um dos métodos abaixo para gerar uma chave segura:

**Método 1 - Online:**
- Acesse: https://www.uuidgenerator.net/
- Copie o UUID gerado

**Método 2 - Terminal (Linux/Mac):**
```bash
openssl rand -base64 32
```

**Método 3 - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3.4. Preencher o arquivo .env

Abra o arquivo `backend/.env` e preencha com suas credenciais:

```bash
JWT_SECRET=sua_chave_gerada_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
PORT=3000
```

### 4. Configurar Banco de Dados

Execute os scripts SQL no Supabase:

1. Acesse **SQL Editor** no dashboard do Supabase
2. Execute os scripts de criação de tabelas (disponíveis em `/modelagem_bd/`)

### 5. Iniciar o Servidor

```bash
cd backend
node server.js
```

O servidor estará rodando em: `http://localhost:3000`

### 6. Acessar o Frontend

Abra o arquivo `frontend/html/login.html` no navegador ou use um servidor local:

**Opção 1 - Live Server (VS Code):**
- Instale a extensão "Live Server"
- Clique direito em `index.html` → "Open with Live Server"

**Opção 2 - Python:**
```bash
python -m http.server 8000
# Acesse: http://localhost:8000
```

**Opção 3 - Node http-server:**
```bash
npx http-server -p 8000
```

## 🔐 Segurança

### ⚠️ IMPORTANTE

- **NUNCA** commite o arquivo `.env` no Git
- **NUNCA** compartilhe suas credenciais publicamente
- Mantenha o `JWT_SECRET` secreto e único por ambiente
- Use credenciais diferentes para desenvolvimento e produção

### Verificar se .env está protegido

Execute no terminal:

```bash
git status
```

Se aparecer `.env` na lista, execute:

```bash
git rm --cached backend/.env
git commit -m "Remove .env from repository"
```

## 🆘 Problemas Comuns

### Erro: "Cannot find module 'dotenv'"

```bash
cd backend
npm install
```

### Erro: "SUPABASE_URL is not defined"

Verifique se:
1. O arquivo `.env` existe em `backend/.env`
2. As variáveis estão preenchidas corretamente
3. Não há espaços extras nas variáveis

### Erro: "Token inválido" no login

1. Verifique se o `JWT_SECRET` está configurado
2. Limpe o localStorage do navegador (F12 → Application → Local Storage → Clear)

## 📚 Próximos Passos

Após a configuração:

1. Crie o primeiro usuário administrador via rota `/api/auth/register`
2. Faça login no sistema
3. Configure os status iniciais do Kanban
4. Comece a cadastrar demandas!

## 🤝 Suporte

Em caso de dúvidas, abra uma issue no repositório ou entre em contato com o time de desenvolvimento.