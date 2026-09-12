# Verus ERP

Sistema de gestão para empresa de impermeabilização. Construído com Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma + SQLite, NextAuth, TanStack Query e Zustand.

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis
cp .env.example .env

# 3. Criar banco SQLite e schema
npx prisma db push

# 4. Popular dados de exemplo
npm run db:seed

# 5. Subir dev server
npm run dev
```

Acesse http://localhost:3000.

**Login demo:** `admin@verus.com.br` / `admin123`

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — start em produção
- `npm run lint` — lint
- `npm run db:push` — aplica `prisma/schema.prisma` ao banco
- `npm run db:seed` — popula dados de exemplo
- `npm run db:studio` — abre o Prisma Studio

## Identidade visual

| Token | Cor |
|---|---|
| brand | `#0B5FFF` |
| brand-dark | `#0A2540` |
| brand-light | `#E6F0FF` |
| success | `#10B981` |
| warning | `#F59E0B` |
| danger | `#EF4444` |

Fontes: **Inter** (UI) e **Barlow** (títulos/números).

## Status dos módulos

| Módulo | Status | Observação |
|---|---|---|
| Dashboard | OK | KPIs e gráficos com dados reais |
| Site público `/` | OK | Landing com captura de lead (UTM, gclid, pixel) |
| WhatsApp Cloud API | OK | Coexistência, inbox, mídia, templates aprovados, dono da conversa |
| Clientes | OK | CRUD + anexos + portal do cliente |
| CRM & Funil | OK | Kanban, leads com atribuição, timeline |
| Atendimentos | OK | Chamados por canal, urgência, fotos, agenda visita |
| Visitas técnicas | OK | Check-in/out, diagnóstico, fotos |
| Orçamentos | OK | Motor por materiais, por planta (DWG/DXF), PDF, link público com aceite, e-mail |
| Serviços / Materiais / Fabricantes | OK | |
| Contratos | OK | Gerado do orçamento |
| Obras | OK | Cronograma, diário com fotos, equipe, medições, custos, anexos, link público, termo de garantia |
| Etapas | OK | |
| Equipes | OK | Colaboradores, custo, login, quem está em qual obra |
| Agenda | OK | Com clima (Open-Meteo) |
| Estoque / Compras / Fornecedores | OK | |
| Financeiro | OK | Contas a pagar/receber, fluxo de caixa |
| Medições | OK | |
| Garantias / Pós-venda | OK | Chamados de assistência |
| Manutenção preventiva | OK | Plano por obra, aviso automático 30 dias antes (equipe + cliente) |
| Gatilho de chuva | OK | Choveu acima do limiar na cidade → WhatsApp para a carteira |
| Documentos | OK | Anexos por cliente/obra/contrato/orçamento |
| Relatórios | OK | Comercial, orçamentos, obras, financeiro, pós-venda — export CSV |
| Notificações | OK | Cron diário |
| Usuários | OK | Papéis, senha, inativação |
| Configurações | OK | WhatsApp, integrações |
| App de campo `/campo` | OK | Técnico: etapas, diário, fotos, ponto |
| Portal do cliente `/portal` | OK | |

## Permissões

`lib/permissions.ts` define a matriz papel × módulo. O middleware aplica em `/api/*` e `/dashboard/*`; a Sidebar esconde o que o papel não lê.

| Papel | Resumo |
|---|---|
| ADMIN | tudo, inclusive usuários e configurações |
| GESTOR | tudo, menos usuários/configurações |
| SUPERVISOR / ENGENHEIRO | operação de obra, estoque, compras; engenheiro também orça |
| COMERCIAL | clientes, CRM, WhatsApp, visitas, orçamentos, contratos |
| FINANCEIRO | financeiro, compras, medições, contratos |
| TECNICO | campo: visitas, etapas, diário |

Só ADMIN/GESTOR apagam registros; os demais inativam/cancelam.

## Arquivos e integrações

| Integração | Env | Sem configurar |
|---|---|---|
| Fotos/documentos | `STORAGE_PROVIDER=db` (padrão, Postgres) ou `supabase` + `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` | funciona no banco |
| WhatsApp | `WHATSAPP_PROVIDER=meta` + app da Meta (ver `docs/MARKETING-SETUP.md`) | modo mock (só loga) |
| E-mail | `RESEND_API_KEY`, `EMAIL_FROM` | modo mock |
| NFS-e | `NFE_PROVIDER=nfeio\|enotas`, `NFE_TOKEN`, `NFE_COMPANY_ID`, `NFE_SERVICE_CODE` | modo mock |
| Cron | `CRON_SECRET`; Vercel chama `/api/cron/notifications` às 9h (notificações, manutenção, gatilho de chuva) | — |

Imagens são reduzidas no navegador (1600 px, JPEG 0.82) antes do upload. Teto 15 MB por arquivo.

## Testes

```bash
npm test          # vitest (permissões, relatórios/CSV, storage, whatsapp)
npm run typecheck # tsc --noEmit
npm run lint
```

## Estrutura

```
app/
  layout.tsx              raiz com Inter + Barlow
  globals.css             Tailwind + utilitários (.card, .btn-primary, etc.)
  login/page.tsx          tela de login
  dashboard/
    layout.tsx            Sidebar + Topbar
    page.tsx              Dashboard com KPIs e gráficos
    {módulo}/             uma pasta por módulo (lista, novo, [id])
  api/
    auth/[...nextauth]/   NextAuth credentials
    {módulo}/             GET/POST + [id] GET/PUT/DELETE
    foto/                 upload (POST) e leitura pública (GET /api/foto/{id})
    anexos/               documentos por entidade
    relatorios/           JSON e CSV
    cron/notifications    rotina diária

components/
  layout/                 Sidebar, Topbar
  ui/                     Button, Card, Input, Badge, Table, Modal, Tabs, Select
  dashboard/              KpiCard, RevenueChart, ObrasStatusChart
  clientes/               ClienteForm
  providers/              QueryProvider

lib/
  prisma.ts               singleton
  auth.ts                 NextAuth config
  permissions.ts          matriz papel × módulo (middleware + sidebar)
  storage.ts              arquivos (db | supabase)
  relatorios.ts           consultas gerenciais + CSV
  pos-venda.ts            manutenção preventiva e gatilho de chuva (cron)
  integrations/           whatsapp, email (Resend), nfe (NFe.io/eNotas)
  whatsapp/meta.ts        Cloud API: texto, mídia, templates, webhook
  utils.ts                cn, formatCurrency, formatDate, formatCNPJ/CPF/Phone
  validations/            zod schemas

hooks/
  useClientes.ts          TanStack Query hooks

types/index.ts            tipos globais

prisma/
  schema.prisma           schema completo
  seed.ts                 dados iniciais
```

## Próximos passos sugeridos

1. Configurar na Vercel: Meta (WhatsApp/pixel), Resend, NF-e e `STORAGE_PROVIDER=supabase` se o banco crescer.
2. Testes de integração das rotas com banco de teste (hoje só unitários).
3. Assinatura eletrônica de contrato (hoje só a proposta tem aceite digital).
4. App de campo offline (PWA com fila de sincronização).
