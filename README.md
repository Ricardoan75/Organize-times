# ⚽ Organize Futebol Global

Sistema completo para organização, cadastro e classificação de times de futebol por hierarquia geográfica (Continente → País → Estado → Município → Bairro).

---

## 📁 Estrutura do Projeto

```
organize-futebol-global/
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py      # Configurações (pydantic-settings)
│   │   │   ├── supabase.py    # Cliente Supabase
│   │   │   └── security.py    # JWT + permissões
│   │   ├── routers/
│   │   │   ├── auth.py        # Login / Registro
│   │   │   ├── localizacao.py # Continentes, Países, Estados, Municípios, Bairros
│   │   │   ├── times.py       # CRUD Times
│   │   │   ├── campeonatos.py # CRUD Campeonatos
│   │   │   ├── partidas.py    # CRUD Partidas + Placar
│   │   │   └── classificacao.py # Ranking e Tabela
│   │   └── schemas/
│   │       └── schemas.py     # Validação Pydantic
│   ├── main.py                # App FastAPI principal
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx     # Sidebar + navegação
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TimesPage.jsx
│   │   │   ├── CriarTimePage.jsx
│   │   │   ├── CampeonatosPage.jsx
│   │   │   ├── CriarCampeonatoPage.jsx
│   │   │   ├── PartidasPage.jsx
│   │   │   ├── ClassificacaoPage.jsx
│   │   │   └── RankingPage.jsx
│   │   ├── services/
│   │   │   └── api.js         # Axios + todos os endpoints
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── database/
    └── schema.sql             # SQL completo Supabase
```

---

## 🚀 Como Rodar Localmente

### 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `database/schema.sql`
3. Copie a **URL** e as **keys** do seu projeto (Settings → API)

### 2. Backend (FastAPI)

```bash
cd backend

# Copiar e configurar .env
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Instalar dependências
pip install -r requirements.txt

# Rodar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

📍 API disponível em: http://localhost:8000  
📖 Docs Swagger: http://localhost:8000/docs

### 3. Frontend (React)

```bash
cd frontend

# Copiar e configurar .env
cp .env.example .env
# Edite VITE_API_URL se necessário

# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

📍 App disponível em: http://localhost:5173

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas criadas pelo schema.sql:
- `continentes` → `paises` → `estados` → `municipios` → `bairros`
- `profiles` (usuários autenticados)
- `times` (com escudo e localização)
- `campeonatos` (com nível geográfico)
- `campeonato_times` (times inscritos)
- `partidas` (com placar)
- `classificacao` (atualizada automaticamente)

### Trigger automático:
Ao registrar o placar de uma partida como `finalizada`, o trigger `trg_atualizar_classificacao` atualiza automaticamente a tabela `classificacao` com:
- Pontos (V=3, E=1, D=0)
- Vitórias, Empates, Derrotas
- Gols pró, Gols contra, Saldo de gols

### View de Ranking:
`vw_ranking_global` agrega dados de classificação com localização geográfica completa.

---

## 🔐 Permissões

| Ação | Técnico | Administrador |
|------|---------|---------------|
| Criar time próprio | ✅ | ✅ |
| Ver times/campeonatos | ✅ | ✅ |
| Criar campeonato (bairro) | ✅ | ✅ |
| Criar campeonato (município+) | 🔒 Plano Pago | ✅ |
| Registrar partidas | ✅ | ✅ |
| Deletar times | ❌ | ✅ |
| Gerenciar localização | ❌ | ✅ |

---

## 💰 Sistema de Planos (Monetização)

| Plano | Nível de Campeonato | Preço |
|-------|---------------------|-------|
| **Grátis** | Apenas Bairro | R$ 0 |
| **Básico** | Bairro + Município + Estado | R$ 29/mês |
| **Premium** | Todos os Níveis (incl. País e Continente) | R$ 79/mês |

Para integrar pagamento: implemente Stripe ou Pagar.me, atualize o campo `plano` na tabela `profiles` após confirmação do pagamento.

---

## 🏗️ Deploy

### Backend (Railway / Render / Fly.io)
```bash
# Variáveis de ambiente necessárias:
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
SECRET_KEY=...
DEBUG=False
CORS_ORIGINS=["https://seu-frontend.vercel.app"]
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Configurar VITE_API_URL para URL do backend em produção
```

---

## 🔮 Melhorias Futuras

1. **Upload de imagens**: Integrar Supabase Storage para escudos reais
2. **Fase eliminatória**: Adicionar chaveamento mata-mata além do pontos corridos
3. **Notificações**: Push notifications para resultados de partidas
4. **Estatísticas avançadas**: Artilharia, assistências, cartões
5. **App móvel**: React Native com o mesmo backend
6. **Exportar classificação**: PDF da tabela de classificação
7. **Chat/Comentários**: Seção de comentários por partida
8. **Integração com WhatsApp**: Envio automático de resultados
9. **Dashboard Admin**: Painel completo de gestão para administradores
10. **API pública**: Endpoints públicos para consulta de rankings sem autenticação

---

## 📡 Principais Endpoints da API

```
POST   /api/auth/register         → Criar conta
POST   /api/auth/login            → Autenticar

GET    /api/localizacao/continentes  → Listar continentes
GET    /api/localizacao/paises       → Listar países
GET    /api/localizacao/estados      → Listar estados
GET    /api/localizacao/municipios   → Listar municípios
GET    /api/localizacao/bairros      → Listar bairros

GET    /api/times/               → Listar times (com filtros)
POST   /api/times/               → Criar time
PUT    /api/times/{id}           → Editar time
DELETE /api/times/{id}           → Desativar time (admin)

GET    /api/campeonatos/         → Listar campeonatos
POST   /api/campeonatos/         → Criar campeonato
POST   /api/campeonatos/{id}/times/{time_id} → Inscrever time

GET    /api/partidas/            → Listar partidas
POST   /api/partidas/            → Criar partida
PATCH  /api/partidas/{id}/placar → Registrar placar

GET    /api/classificacao/campeonato/{id} → Tabela de classificação
GET    /api/classificacao/ranking         → Ranking global filtrado
GET    /api/classificacao/melhor-por-nivel → Melhor time por nível
```
