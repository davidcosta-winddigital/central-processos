# Central de Processos

Sistema **full stack** para gestão e documentação de processos internos.
Permite cadastrar setores, campos dinâmicos por setor, processos com etapas
organizadas e acompanhar o progresso das etapas em uma interface estilo
onboarding.

## Stack

- **Backend:** Laravel 10 (PHP 8.2)
- **Banco de dados:** MySQL 8
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Infra:** Docker + Docker Compose

## Estrutura

```
central-processos/
├── backend/            # API Laravel (models, controllers, migrations, seeders)
├── frontend/           # SPA React + Vite + Tailwind
├── docker-compose.yml  # Orquestração dos containers
└── .env.example        # Variáveis de ambiente do compose
```

## Modelo de dados

- **setores** (`nome`, `descricao`)
- **processos** (`setor_id`, `titulo`, `descricao`)
- **etapas** (`processo_id`, `titulo`, `descricao`, `ordem`, `concluida`)
- **campos_personalizados** (`setor_id`, `nome`, `rotulo`, `tipo`, `opcoes`, `obrigatorio`)
- **valores_campos** (`processo_id`, `campo_personalizado_id`, `valor`)

Relacionamentos:
- Setor `hasMany` Processos e Campos Personalizados
- Processo `hasMany` Etapas e Valores de Campo
- Valor de Campo `belongsTo` Processo e Campo

Tipos de campo suportados: `texto`, `numero`, `data`, `selecao` (dropdown com opções).

## Subir o ambiente (passo a passo)

### 1. Copie as variáveis de ambiente

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Suba os containers

```bash
docker compose up -d --build
```

Containers criados:
- `cp_mysql` — MySQL 8 (porta **3306**)
- `cp_backend` — Laravel serve (porta **8000**)
- `cp_frontend` — Vite dev server (porta **5173**)

### 3. Instale dependências do backend e gere a chave

```bash
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
```

### 4. Rode migrations e seeders

```bash
docker compose exec backend php artisan migrate --seed
```

### 5. Instale dependências do frontend (caso necessário)

O container `frontend` já executa `npm install` automaticamente no start.
Se precisar rodar manualmente:

```bash
docker compose exec frontend npm install
```

### 6. Acesse a aplicação

- Frontend: <http://localhost:5173>
- API: <http://localhost:8000/api>
- Health check: <http://localhost:8000/api/health>

## Comandos úteis

| Ação | Comando |
| --- | --- |
| Subir containers | `docker compose up -d` |
| Parar containers | `docker compose down` |
| Ver logs do backend | `docker compose logs -f backend` |
| Ver logs do frontend | `docker compose logs -f frontend` |
| Instalar composer | `docker compose exec backend composer install` |
| Rodar migrations | `docker compose exec backend php artisan migrate` |
| Rodar seeders | `docker compose exec backend php artisan db:seed` |
| Resetar DB | `docker compose exec backend php artisan migrate:fresh --seed` |
| Instalar npm | `docker compose exec frontend npm install` |
| Dev frontend | `docker compose exec frontend npm run dev` |
| Build frontend | `docker compose exec frontend npm run build` |

## API REST

### Setores
- `GET    /api/setores` — lista setores
- `POST   /api/setores` — cria setor
- `GET    /api/setores/{id}` — detalhe (com campos e processos)
- `PUT    /api/setores/{id}` — atualiza
- `DELETE /api/setores/{id}` — remove (cascata)

### Campos personalizados
- `GET    /api/setores/{setor}/campos`
- `POST   /api/setores/{setor}/campos`
- `PUT    /api/campos/{campo}`
- `DELETE /api/campos/{campo}`

### Processos
- `GET    /api/setores/{setor}/processos`
- `POST   /api/setores/{setor}/processos` — aceita `etapas[]` e `valores[]`
- `GET    /api/processos/{id}` — inclui setor, etapas e valores dos campos
- `PUT    /api/processos/{id}`
- `DELETE /api/processos/{id}`

### Etapas
- `POST   /api/processos/{processo}/etapas`
- `PUT    /api/etapas/{etapa}`
- `DELETE /api/etapas/{etapa}`
- `PATCH  /api/etapas/{etapa}/concluir`
- `PATCH  /api/etapas/{etapa}/reabrir`

## Funcionalidades do frontend

- **Dashboard** listando setores com CRUD em modal.
- **Setor → Processos → Etapas**, com breadcrumb de navegação.
- **Gerenciamento de campos personalizados** por setor (texto / número / data / seleção).
- **Formulário de novo processo** com campos dinâmicos renderizados a partir
  dos campos definidos pelo setor e validação de campos obrigatórios.
- **Onboarding** no detalhe do processo: barra de progresso e checkboxes
  para marcar etapas como concluídas.
- **Tailwind** com design moderno e responsivo.

## Seeders

O seeder popula três setores (RH, TI, Financeiro), campos personalizados
variados (texto, número, data e seleção) e processos completos com etapas,
ideal para validar o sistema logo após subir o ambiente.
