# Sistema de Gestão de Gabinete - Fase 1

## 📌 Visão Geral
O **Sistema de Gestão de Gabinete** é uma plataforma desenvolvida para organizar e gerenciar demandas internas e externas de forma eficiente.  
Na **primeira fase**, o foco será a implementação de um **Kanban** para acompanhamento de solicitações, com funcionalidades de **cadastro de usuários** e **registro de demandas**, incluindo a identificação dos **geradores de solicitações**.

---

## 🎯 Objetivos da Fase 1
- Organizar demandas em um fluxo visual utilizando o método Kanban.
- Controlar usuários do sistema com permissões básicas.
- Registrar solicitações com informações sobre quem as gerou.
- Facilitar o acompanhamento e a priorização das atividades.

---

## 🛠 Funcionalidades
### 1. **Cadastro de Usuários**
- Nome completo
- E-mail
- Senha
- Tipo de usuário (Administrador / Operacional)
- Status (Ativo / Inativo)

### 2. **Cadastro de Solicitações**
- Título da solicitação
- Descrição detalhada
- Data de criação
- Status inicial (A Fazer, Em Andamento, Concluído)
- Gerador da demanda (nome e contato)
- Responsável pela execução

### 3. **Quadro Kanban**
- Colunas padrão:
  - **A Fazer**  
  - **Em Andamento**  
  - **Concluído**
- Movimentação das solicitações entre colunas via drag-and-drop.
- Visualização filtrada por responsável ou por gerador da demanda.

---

## 🗂 Estrutura Inicial do Banco de Dados
### Tabela: `usuarios`
| Campo           | Tipo       | Descrição                      |
|-----------------|------------|--------------------------------|
| id              | INT (PK)   | Identificador único do usuário |
| nome            | VARCHAR    | Nome completo                  |
| email           | VARCHAR    | E-mail do usuário              |
| senha           | VARCHAR    | Senha criptografada            |
| tipo_usuario    | ENUM       | Administrador / Operacional    |
| status          | ENUM       | Ativo / Inativo                |

### Tabela: `solicitacoes`
| Campo           | Tipo       | Descrição                             |
|-----------------|------------|---------------------------------------|
| id              | INT (PK)   | Identificador único da solicitação    |
| titulo          | VARCHAR    | Título resumido                       |
| descricao       | TEXT       | Descrição detalhada                   |
| data_criacao    | DATETIME   | Data e hora do registro               |
| status          | ENUM       | A Fazer / Em Andamento / Concluído    |
| gerador_nome    | VARCHAR    | Nome de quem gerou a demanda          |
| gerador_contato | VARCHAR    | Contato do gerador da demanda         |
| responsavel_id  | INT (FK)   | Usuário responsável pela execução     |

---

## 🔒 Regras de Acesso
- **Administrador**: gerencia usuários, visualiza e edita todas as solicitações.
- **Operacional**: visualiza e edita apenas solicitações atribuídas a si.

---

## 🚀 Tecnologias Sugeridas
- **Frontend**: React / Vue.js
- **Backend**: Node.js (Express) / Python (Django/FastAPI)
- **Banco de Dados**: MySQL / PostgreSQL
- **Autenticação**: JWT (JSON Web Token)
- **Kanban**: Biblioteca Drag-and-Drop (React Beautiful DnD, Vue Draggable, etc.)

---

## 📅 Próximos Passos
1. Criar modelagem do banco de dados.
2. Implementar autenticação e cadastro de usuários.
3. Desenvolver interface inicial do Kanban.
4. Criar fluxo de cadastro e movimentação de solicitações.
