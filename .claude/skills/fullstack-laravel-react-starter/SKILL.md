---
name: fullstack-laravel-react-starter
description: Inicia um novo projeto Full Stack baixando o template "layout-base" da Wind Digital (Laravel 11 + React + Tailwind + Vite + Docker já com permissões hierárquicas, dark mode, AdvancedTable, registro/aprovação de usuários, dashboard) e aplicando as customizações do usuário (nome do app, admin, entidades). O download é autenticado via API prolicitante.com.br/projeto-base (email corporativo + código de 6 dígitos). Use SEMPRE que o usuário pedir "criar projeto Full Stack", "novo projeto Laravel React", "scaffold Laravel React Tailwind", "começar do zero um Laravel React", "baixar template base", "novo projeto Wind Digital" ou variações. Para empacotar projeto existente para produção use stack-laravel-react-portainer.
---

# Full Stack Laravel + React + Tailwind + Vite — Starter

Skill que **baixa o template completo** (`bitbucket.org/winddigital/layout-base`) via fluxo autenticado por email e **aplica as customizações** do usuário sobre o template. O resultado: um projeto pronto para `docker-compose up -d`, já com nome, admin e entidades do usuário plugados em uma base que inclui:

- Permissões hierárquicas (Group → User, módulo × ação)
- Registro/aprovação de usuários
- Dashboard com KPIs
- Dark mode com persistência
- AdvancedTable (filtros server-side, paginação, views salvas)
- MODELOS de referência (CRUD completo, formulários, tabelas, modais)
- Auto-login phpMyAdmin
- HMR via nginx

## Quando esta skill se aplica

- Usuário começando um projeto **do zero** (diretório vazio ou com poucos arquivos sem `docker-compose.yml`).
- Quer Laravel + React + Tailwind + MySQL + Docker.
- Tem email autorizado (`@prolicitante.com.br` ou `@winddigital.com.br`, ou liberado manualmente em `projeto-base/config.php`).

Se o projeto **já existe** e o usuário quer empacotar para produção, **NÃO use esta skill** — direcione para `stack-laravel-react-portainer`.

## Fluxo de execução

Siga estritamente esta ordem.

### Etapa 0 — Verificação de Git

Antes de baixar nada, verifique se o diretório-alvo é um repositório git.

```bash
git rev-parse --is-inside-work-tree 2>/dev/null
```

- **`true`** → marque `GIT_AVAILABLE = true` e siga.
- **erro** → marque `GIT_AVAILABLE = false` e avise **uma única vez**:

  > ⚠️ **Este diretório não é um repositório Git.** Vou prosseguir baixando e customizando o template, mas não vou conseguir commitar automaticamente. Sem histórico de commits, **reversões serão manuais**. Recomendo rodar `git init` antes de continuar; quer que eu faça isso agora?

  Use `AskUserQuestion` com options: `["Sim, rodar git init", "Não, prosseguir sem git"]`. Se aceitar, rode `git init` e marque `GIT_AVAILABLE = true`.

### Etapa 1 — Identidade do projeto (AskUserQuestion)

Uma chamada `AskUserQuestion` com **três perguntas**:

1. **Nome da Aplicação** (header `"App name"`)
   - Question: `"Qual é o nome da aplicação? (ex: Painel Vendas, Gestor de Editais)"`
   - Options: `[{ label: "Digitar nome", description: "Você fornecerá o nome no próximo turno" }]`
   - multiSelect: false

2. **Email do admin do APP** (header `"Admin email"`) — login do admin do sistema gerado, **não** o email Wind para baixar o template.
   - Question: `"Qual o email do usuário admin (login inicial do sistema gerado)?"`
   - Options: `[{ label: "admin@<slug>.com", description: "Baseado no nome do app" }, { label: "admin@admin.com", description: "Padrão genérico" }]`

3. **Senha do admin do APP** (header `"Admin password"`)
   - Question: `"Qual a senha inicial do admin? (será exigida troca no primeiro login)"`
   - Options: `[{ label: "123456", description: "Padrão dev — troca obrigatória no primeiro login" }, { label: "password", description: "Outro padrão de dev" }]`

Se o usuário escolher "Outro" em qualquer pergunta, pergunte o valor no chat.

Salve como `APP_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Compute `SLUG = snake_case(APP_NAME)` (ex: "Painel Vendas" → `painel_vendas`).

### Etapa 2 — Domínio do negócio (AskUserQuestion)

Linguagem do dia-a-dia. Uma chamada com **quatro perguntas em paralelo**.

1. **Tipo do sistema** (header `"Tipo"`, multiSelect: false)
   - Question: `"Que tipo de sistema é esse?"`
   - Options:
     - `Sistema interno (admin/cadastros)` — "Para uso da equipe: cadastrar clientes, pedidos, produtos"
     - `Loja virtual` — "Vender produtos ou serviços pela internet"
     - `Plataforma de cursos` — "Aulas, alunos, professores"
     - `Sistema financeiro` — "Despesas, contas, fluxo de caixa"

2. **Quem vai usar** (header `"Usuários"`, multiSelect: true)
   - Options:
     - `Eu / minha equipe (administradores)`
     - `Funcionários / operadores`
     - `Clientes / usuários finais`
     - `Visitantes (sem cadastro)`

3. **O que o sistema precisa fazer** (header `"Funcionalidades"`, multiSelect: true)
   - Options:
     - `Cadastrar e listar informações`
     - `Painel com gráficos e números`
     - `Subir e guardar arquivos`
     - `Mandar avisos por email ou no sistema`

4. **Conexões com outros serviços** (header `"Conexões"`, multiSelect: true)
   - Options:
     - `Nada agora`
     - `Mandar email automático`
     - `Login com Google ou Microsoft`
     - `Cobrar com cartão / Pix`

Depois, **uma pergunta de texto livre** no chat:

> "Última pergunta: **quais são as principais 'coisas' que o sistema vai guardar?**
>
> Exemplos: numa loja → Produto, Cliente, Pedido. Numa escola → Aluno, Curso, Aula.
>
> Me diz só os nomes, separados por vírgula. Vou criar a estrutura básica de cada uma."

Salve como `ENTITIES` (lista). Aceita os termos do negócio do usuário sem traduzir.

### Etapa 3 — Download do template via `requisicao`

#### 3.1. Email corporativo Wind/Pró

`AskUserQuestion` (header `"Email Wind/Pró"`, multiSelect: false):
- Question: `"Qual seu email Wind Digital ou Pró Licitante? (necessário para autorizar o download do template — diferente do admin do app)"`
- Options:
  - `Digitar email` — "Você fornecerá no próximo turno"

Salve como `WIND_EMAIL`. Valide formato `@prolicitante.com.br` ou `@winddigital.com.br` antes de seguir; se não bater, avise e pergunte de novo.

#### 3.2. Solicita código de cadastro

Use a env `REQUISICAO_BASE_URL` (default `https://prolicitante.com.br/projeto-base`; em dev pode setar `http://localhost/requisicao`).

```bash
curl -fsS -X POST "${REQUISICAO_BASE_URL:-https://prolicitante.com.br/projeto-base}/api/request-access.php" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"<WIND_EMAIL>\",\"name\":\"<APP_NAME>\"}"
```

Esperado: `{ ok: true, message, purpose: "registration"|"download", is_new }`. Se falhar, mostre o erro literal e pergunte se reenvia.

#### 3.3. Coleta o código

Pergunte no chat: "Enviei um código de 6 dígitos para `<WIND_EMAIL>`. Cole aqui:" — aceite a resposta como texto livre (`AskUserQuestion` com option `"Digitar código"` + Outro).

#### 3.4. Verifica e obtém URL de download

```bash
curl -fsS -X POST "${REQUISICAO_BASE_URL:-https://prolicitante.com.br/projeto-base}/api/verify.php" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"<WIND_EMAIL>\",\"code\":\"<CODE>\"}"
```

- Se resposta `{ stage: "ready", download_url, expires_in }` → siga para 3.5. (Um único código basta — não há mais 2ª etapa.)
- Se erro → mostre literal e pergunte se reenvia (volta a 3.2).

#### 3.5. Baixa e descompacta

```bash
curl -fLsS -o /tmp/template.zip "<download_url>"
mkdir -p /tmp/template-extract
unzip -qo /tmp/template.zip -d /tmp/template-extract
# o ZIP contém uma pasta-prefixo "<repo>-<commit12>/"
PREFIX=$(ls /tmp/template-extract | head -n1)
# move tudo para o diretório-alvo (cwd ou subpasta combinada com o usuário)
cp -rT "/tmp/template-extract/$PREFIX" "<root>"
rm -rf /tmp/template.zip /tmp/template-extract
```

**Limpar qualquer vestígio de git do template (CRÍTICO):** o projeto novo
precisa começar com histórico próprio, não herdar nada de `layout-base`.

```bash
rm -rf "<root>/.git"
```

Se `GIT_AVAILABLE = true` (Etapa 0 confirmou que o diretório-alvo já era um
repo git, ou o usuário aceitou `git init`), pule este passo só se o `.git`
do diretório-alvo for o mesmo do usuário (não do template). Na prática:
o ZIP do `requisicao` não inclui `.git` (a API do Bitbucket lista apenas
arquivos versionados), mas mantenha o `rm -rf` por garantia.

Se `GIT_AVAILABLE = false` e o usuário **não** quis `git init` na Etapa 0,
deixe sem `.git` mesmo. Se quiser, pode **reoferecer** agora:

> "Template baixado. Quer que eu rode `git init` agora para você ter
>  histórico do seu projeto desde o primeiro commit?"

(Use `AskUserQuestion`. Se aceitar, rode `git init` e marque
`GIT_AVAILABLE = true` para a Etapa 5 commitar o scaffold.)

**Linux line-endings (CRÍTICO no Windows):** corrija `entrypoint.sh`:

```bash
# remove CR; o shebang #!/bin/sh quebra com CRLF
tr -d '\r' < "<root>/docker/php/entrypoint.sh" > "<root>/docker/php/entrypoint.sh.tmp" \
  && mv "<root>/docker/php/entrypoint.sh.tmp" "<root>/docker/php/entrypoint.sh" \
  && chmod +x "<root>/docker/php/entrypoint.sh"
```

Salve `TEMPLATE_COMMIT` (12 chars do prefixo) para usar na mensagem de commit.

### Etapa 4 — Aplicar customizações sobre o template

Aplique cada patch via tool `Edit`. Antes de cada `Edit`, leia o arquivo (a tool exige `Read` prévio). Se um `old_string` já não aparecer (skill foi rodada antes), pule esse patch silenciosamente.

#### 4.1. `<root>/docker-compose.yml`

Substitua `replace_all`:
- `container_name: modelo_` → `container_name: <SLUG>_`
- `MYSQL_DATABASE: modelo` → `MYSQL_DATABASE: <SLUG>`
- `DB_DATABASE: modelo` → `DB_DATABASE: <SLUG>`
- `MYSQL_USER: modelo` → `MYSQL_USER: <SLUG>`
- `modelo_mysql:` (volume e referência) → `<SLUG>_mysql:`
- `networks: modelo` (rede no topo e referências) → `networks: <SLUG>`

Use `replace_all: true` para substituir todas as ocorrências de uma vez.

#### 4.2. `<root>/backend/.env.example`

- `APP_NAME=Prolicitante` → `APP_NAME="<APP_NAME>"`
- `DB_DATABASE=modelo` → `DB_DATABASE=<SLUG>`
- `DB_USERNAME=modelo` → `DB_USERNAME=<SLUG>`

(O `.env` ainda não existe — o entrypoint copia do `.env.example` na primeira execução.)

#### 4.3. `<root>/backend/database/seeders/DatabaseSeeder.php`

Patch no bloco do admin raiz. Substitua:

```php
['email' => 'felipe@winddigital.com.br'],
[
    'name' => 'Felipe Macedo',
    'password' => Hash::make('123456'),
    'avatar' => 'FM',
    'is_root_admin' => true,
```

Por:

```php
['email' => '<ADMIN_EMAIL>'],
[
    'name' => 'Administrador',
    'password' => Hash::make('<ADMIN_PASSWORD>'),
    'avatar' => '<INITIALS>',
    'is_root_admin' => true,
    'must_change_password' => true,
```

Onde `INITIALS` = primeiras 2 letras do nome (ou `AD`). Mantenha `group_id`, `role_id`, `active` como estão.

#### 4.4. Migrations + Models para `ENTITIES`

Para cada entidade na lista:

- Compute `STUDLY` (PascalCase, singular — ex: "Cliente"), `PLURAL_SNAKE` (snake_case plural — ex: "clientes"), `TIMESTAMP` (incremente a partir de `date +%Y_%m_%d_%H%M%S`, somando 1 segundo por entidade para garantir ordem).

- Crie `<root>/backend/database/migrations/<TIMESTAMP>_create_<PLURAL_SNAKE>_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('<PLURAL_SNAKE>', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // TODO: campos específicos de <STUDLY>
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('<PLURAL_SNAKE>');
    }
};
```

- Crie `<root>/backend/app/Models/<STUDLY>.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class <STUDLY> extends Model
{
    protected $fillable = ['name'];
}
```

**Não** crie Controllers/rotas/telas — o template já tem CRUD completo em `frontend/src/modelos/` que o usuário usa como referência.

#### 4.5. `<root>/README.md`

Reescreva o cabeçalho substituindo o título "Modelo" por `<APP_NAME>`. Adicione, antes da seção "Subir o ambiente", um bloco de roadmap:

```markdown
## Roadmap inicial

- **Tipo:** <TIPO_DO_SISTEMA>
- **Usuários:** <LISTA_USUARIOS>
- **Funcionalidades pretendidas:** <LISTA_FEATURES>
- **Integrações:** <LISTA_CONEXOES>
- **Entidades:** <ENTITIES>

### Credenciais admin (seeder)

- Email: `<ADMIN_EMAIL>`
- Senha: `<ADMIN_PASSWORD>` (troca obrigatória no primeiro login)
```

#### 4.6. `<root>/frontend/index.html`

- `<title>...</title>` → `<title><APP_NAME></title>`

#### 4.7. `<root>/frontend/package.json`

- `"name": "..."` → `"name": "<SLUG>"`

### Etapa 5 — Commit + mensagem final

Se `GIT_AVAILABLE = true`:

```bash
git add -A
git commit -m "feat: scaffold inicial via fullstack-laravel-react-starter

- Template layout-base@<TEMPLATE_COMMIT>
- App: <APP_NAME>
- Admin seeder: <ADMIN_EMAIL>
- Entidades: <ENTITIES>"
```

Se `GIT_AVAILABLE = false`, pule silenciosamente.

Depois mostre:

```
✅ Projeto "<APP_NAME>" criado a partir de layout-base@<TEMPLATE_COMMIT>.

Estrutura: template completo + <N> migrations + <N> Models customizados
<Se commitou:>   Commit: <hash curto>
<Se sem git:>    ⚠️ Sem git — sem commit. Reversões manuais.

Próximo passo: docker-compose up -d
  (a primeira execução roda: composer install, key:generate, migrate --seed,
   npm install — pode demorar alguns minutos)

URLs após subir:
- Aplicação:  http://localhost
- API:        http://localhost/api
- phpMyAdmin: http://localhost:81  (auto-login como root)

Login admin:
  email: <ADMIN_EMAIL>
  senha: <ADMIN_PASSWORD>  (troca obrigatória no 1º login)

Para ver exemplos de CRUD/Tabela/Formulário use o menu MODELOS
(visível apenas para o admin raiz). Use como referência para
implementar as telas das entidades: <ENTITIES>.

Quando for empacotar para produção, peça `stack-laravel-react-portainer`.
```

## Notas importantes

- **A skill NÃO gera arquivos do zero.** Ela baixa um template completo já com permissões/dashboard/dark mode/AdvancedTable e aplica patches pontuais. Se quiser regerar do zero (template limpo), restaure o template manualmente — a skill não tem esse modo.
- **O ZIP vem cacheado pelo `requisicao` por 10 minutos.** Múltiplas chamadas próximas retornam o mesmo conteúdo, OK.
- **Tokens de download são uso único e expiram em 15 minutos.** Se o `unzip` falhar, peça novo código (não reuse o token consumido).
- **CRLF no Windows é uma armadilha clássica.** Sempre rode `tr -d '\r'` no `entrypoint.sh` após `unzip` — sem isso o container `backend` falha em iniciar com erro `not found` no shebang.
- **Patches são idempotentes por design** (procuram `old_string` específica). Se a skill rodar de novo no mesmo diretório, patches já aplicados são pulados (Edit falha "string not found" — trate como sucesso silencioso).
- **`ADMIN_EMAIL` ≠ `WIND_EMAIL`.** O primeiro é o login do app que está sendo gerado; o segundo autoriza o download via `requisicao`. Deixe isso claro nas perguntas para evitar confusão.
- **`must_change_password = true`** é setado para o admin seedado, forçando troca no primeiro login. Boa prática para POC entregue ao cliente.
- **Permissões do template** já cobrem `Usuários` e `Grupos & Permissões`. Ao adicionar novos módulos para as `ENTITIES`, atualize `app/Support/PermissionResolver::MODULES` e adicione regras no `DatabaseSeeder` — isso não é feito pela skill (não tente adivinhar quais ações cada role precisa para o domínio do usuário).
- **Commits são parte do trabalho.** Cada bloco coerente de mudanças vira um commit assim que termina (scaffold inicial + qualquer ajuste pedido depois na mesma sessão). Se `GIT_AVAILABLE = false`, simplesmente não commite — sem repetir o aviso.
- **Não tente "consertar" falhas de git** (identidade, hooks, branch protegido). Reporte o erro literal e siga em frente.
- **Auditoria em `requisicao/dashboard.php`**: cada download via skill aparece no painel da Wind, vinculado ao `WIND_EMAIL`. Útil para acompanhar adoção.
- **Endpoints `requisicao` (referência):**
  - `POST /api/request-access.php` — body `{email, name}` → `{ok, message, purpose, is_new}`
  - `POST /api/verify.php` — body `{email, code}` → `{stage: "need_download_code"|"ready", download_url?, expires_in?, message}`
  - `GET /download.php?token=<64hex>` — stream do ZIP (uso único, expira 15min)
