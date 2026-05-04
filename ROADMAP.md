# Central de Processos — Roadmap & Evolução

> Análise do projeto atual e plano de evolução para um sistema corporativo de documentação de processos multissetorial.

---

## 1. Diagnóstico do projeto atual

**Stack confirmada:** Laravel 10 (PHP 8.2) + MySQL 8 + React 18 + Tailwind CSS + Vite, orquestrados via Docker Compose.

**Domínio implementado (12 migrations existentes):**

| Entidade | Função no domínio |
|----------|-------------------|
| `users` | autenticação Sanctum + flag `is_admin` |
| `setores` | unidade organizacional |
| `setor_user` | usuário pode pertencer a múltiplos setores |
| `processos` | pertencente a um setor |
| `etapas` | passos ordenados de um processo (com `concluida`) |
| `campos_personalizados` | metadados configuráveis por setor |
| `valores_campos` | valores dos campos por processo |
| `processo_campos` | campos exclusivos de um processo (override) |
| `processo_anexos` / `etapa_anexos` | uploads vinculados |
| `personal_access_tokens` | tokens Sanctum |

**Pontos fortes**
- Separação backend/frontend já em containers independentes.
- Modelagem de domínio sólida (setor → processo → etapa).
- Permissionamento por setor via tabela pivot.
- Anexos polimórficos por destino (processo e etapa).

**Lacunas para um produto corporativo multi-setor**
- Não há histórico de alterações (auditoria/compliance).
- Etapas não têm responsável nem SLA.
- Sem comentários, sem menções, sem notificações.
- Sem fluxo de aprovação (essencial para Financeiro/Jurídico).
- Sem versionamento de processos (essencial para ISO/9001).
- Sem busca global, tags, favoritos, ou relacionamentos entre processos.
- Sem integrações externas (webhooks/APIs).

---

## 2. Roadmap de funcionalidades propostas

A proposta abaixo está estruturada em **12 módulos**, cada um com sua própria migration. Tudo segue o padrão Laravel já adotado (snake_case PT-BR, FK com `cascadeOnDelete`, índices em colunas filtráveis).

### Módulo 01 — Tags & Categorias (transversal)
Permite classificar processos por temas que cruzam setores (ex.: `LGPD`, `ISO9001`, `Onboarding`).
- Tabela `tags` (nome, cor, slug).
- Pivot `processo_tag`.
- Endpoint `GET /tags?q=&processo_id=` para autocomplete.

### Módulo 02 — Comentários polimórficos
Discussão em processos e etapas; suporte a menções `@usuario` que disparam notificação.
- Tabela `comentarios` (`comentavel_type`, `comentavel_id`, `user_id`, `conteudo`, `parent_id`).
- Reações simples (`👍`, `✅`, `❓`) opcionais.

### Módulo 03 — Notificações
Inbox in-app + envio opcional por e-mail (com fila Redis).
- Tabela `notificacoes` (driver custom; mais leve que `database` driver default).
- Tipos: `etapa_concluida`, `comentario_mencao`, `aprovacao_pendente`, `prazo_proximo`, `processo_atualizado`.

### Módulo 04 — Auditoria / Trilha de mudanças
Log imutável de tudo que muda (compliance ISO, LGPD, SOX).
- Tabela `auditorias` (`auditavel_type`, `auditavel_id`, `evento`, `alteracoes_json`, `user_id`, `ip`).
- Trait `Auditable` aplicada nos models críticos.

### Módulo 05 — Responsáveis & SLA por etapa
Atribuir cada etapa a um usuário, com prazo e alerta automático.
- Adiciona `responsavel_id`, `prazo_dias`, `prazo_em` à tabela `etapas`.
- Job agendado (`schedule:run`) verifica prazos vencidos e dispara notificações.

### Módulo 06 — Checklist em etapas (sub-etapas)
Itens granulares dentro de uma etapa para auditoria fina (ex.: cada documento da admissão de RH).
- Tabela `checklist_items` (`etapa_id`, `descricao`, `concluido`, `ordem`).

### Módulo 07 — Fluxo de aprovação
Etapas marcadas como `requer_aprovacao` aguardam OK de um aprovador antes de concluir.
- Tabela `aprovacoes` (`etapa_id`, `aprovador_id`, `status`, `comentario`, `decidido_em`).
- Status: `pendente`, `aprovado`, `recusado`.

### Módulo 08 — Versionamento de processo
Cada `update` em `processos` cria um snapshot histórico.
- Tabela `processo_versoes` (`processo_id`, `numero_versao`, `snapshot_json`, `editor_id`, `motivo`).
- API `GET /processos/{id}/versoes` e `POST /processos/{id}/versoes/{versao}/restaurar`.

### Módulo 09 — Favoritos
Cada usuário marca processos que acessa com frequência.
- Tabela `processo_favoritos` (`user_id`, `processo_id`).

### Módulo 10 — Webhooks / Integrações
Permite que outros sistemas (ERP, BPMS, Slack/Teams) recebam eventos.
- Tabela `webhooks` (`evento`, `url`, `secret`, `ativo`, `ultimo_disparo_em`).
- Eventos: `processo.criado`, `etapa.concluida`, `aprovacao.decidida`.

### Módulo 11 — Relacionamentos / Sub-processos
Vincula processos uns aos outros (pré-requisito, processo-pai, dependência cruzada entre setores).
- Tabela `processo_relacionamentos` (`origem_id`, `destino_id`, `tipo`).
- Tipos: `pre_requisito`, `decorre_de`, `relacionado`, `subprocesso_de`.

### Módulo 12 — Categorias por setor
Agrupamento interno (ex.: dentro de RH: `Admissão`, `Desligamento`, `Folha`, `Benefícios`).
- Tabela `categorias` (`setor_id`, `nome`, `cor`).
- Adiciona `categoria_id` em `processos`.

---

## 3. Stack ampliada (mantendo a base)

| Serviço | Imagem | Função |
|---------|--------|--------|
| `mysql` | `mysql:8.0` | Persistência principal |
| `redis` | `redis:7-alpine` | Cache, fila, sessões |
| `backend` | `php:8.2-cli` (custom) | Laravel API |
| `queue` | mesmo build de backend | Worker `php artisan queue:work` |
| `scheduler` | mesmo build de backend | `php artisan schedule:work` |
| `mailhog` | `mailhog/mailhog` | Captura SMTP em dev |
| `frontend` | `node:20-alpine` | Vite dev server |

Nada disso quebra o que já existe — apenas adiciona serviços auxiliares úteis para os novos módulos (notificações, jobs de SLA, eventos de webhook).

---

## 4. Comandos para subir o ambiente

A partir da raiz `C:\Projetos\central-processos`:

```bash
# 1. Copiar .env (apenas na primeira vez)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env  # opcional, já existe

# 2. Subir todos os containers
docker compose up -d --build

# 3. Instalar dependências do backend
docker compose exec backend composer install

# 4. Gerar APP_KEY
docker compose exec backend php artisan key:generate

# 5. Rodar TODAS as migrations (existentes + novas) e seeders
docker compose exec backend php artisan migrate --seed

# 6. Criar link de storage para anexos públicos
docker compose exec backend php artisan storage:link

# 7. Instalar dependências do frontend (se não foram instaladas no build)
docker compose exec frontend npm install

# 8. (Opcional) Limpar caches
docker compose exec backend php artisan optimize:clear
```

**Acesso:**
- Frontend: <http://localhost:5173>
- API: <http://localhost:8000/api>
- MailHog: <http://localhost:8025>
- MySQL: `localhost:3306` (user: `laravel` / pass: `secret`)

**Comandos úteis no dia-a-dia:**

```bash
# Criar uma nova migration (futuras features)
docker compose exec backend php artisan make:migration nome_da_migration

# Rollback da última migration
docker compose exec backend php artisan migrate:rollback

# Reset total (cuidado: apaga dados)
docker compose exec backend php artisan migrate:fresh --seed

# Ver fila de jobs em tempo real
docker compose logs -f queue

# Ver logs do backend
docker compose logs -f backend
```

---

## 5. Próximos passos sugeridos (ordem de implementação)

1. **Aplicar as migrations** desta release (já criadas em `backend/database/migrations/2026_04_29_*`).
2. Implementar **Módulos 01–04** (tags, comentários, notificações, auditoria) — entregam valor imediato e formam a base para os demais.
3. Implementar **Módulo 05** (responsáveis + SLA) — junto com o `scheduler` agendado.
4. Implementar **Módulos 06–08** (checklist, aprovação, versionamento) — atendem requisitos de compliance.
5. Polir UX no frontend: filtros por tag, sino de notificações, timeline de auditoria, badge de favorito.
6. **Módulos 09–12** (favoritos, webhooks, relacionamentos, categorias) como evolução incremental.

Cada módulo vira uma branch / PR independente, mantendo o histórico claro e revisável.
