# Impermeia ERP

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

**Login demo:** `admin@impermeia.com.br` / `admin123`

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

| Módulo | Status |
|---|---|
| Dashboard (KPIs + charts mock) | OK |
| Clientes (CRUD completo) | OK |
| CRM & Funil | Stub |
| Atendimentos | Stub |
| Visitas técnicas | Stub |
| Orçamentos | Stub |
| Serviços | Stub |
| Contratos | Stub |
| Obras | Stub |
| Etapas | Stub |
| Equipes | Stub |
| Agenda | Stub |
| Estoque | Stub |
| Compras | Stub |
| Fornecedores | Stub |
| Financeiro | Stub |
| Medições | Stub |
| Garantias | Stub |
| Pós-venda | Stub |
| Documentos | Stub |
| Relatórios | Stub |
| Notificações | Stub |
| Usuários | Stub |
| Configurações | Stub |

O schema Prisma já cobre **todas** as entidades necessárias para implementar os módulos restantes (`prisma/schema.prisma`).

## Estrutura

```
app/
  layout.tsx              raiz com Inter + Barlow
  globals.css             Tailwind + utilitários (.card, .btn-primary, etc.)
  login/page.tsx          tela de login
  dashboard/
    layout.tsx            Sidebar + Topbar
    page.tsx              Dashboard com KPIs e gráficos
    clientes/             CRUD funcional
    {módulos}/page.tsx    stubs
  api/
    auth/[...nextauth]/   NextAuth credentials
    clientes/             GET/POST + GET/PUT/DELETE por id

components/
  layout/                 Sidebar, Topbar
  ui/                     Button, Card, Input, Badge, Table, Modal, Tabs, Select
  dashboard/              KpiCard, RevenueChart, ObrasStatusChart
  clientes/               ClienteForm
  providers/              QueryProvider
  StubPage.tsx

lib/
  prisma.ts               singleton
  auth.ts                 NextAuth config
  utils.ts                cn, formatCurrency, formatDate, formatCNPJ/CPF/Phone
  validations/            zod schemas (cliente, orcamento, obra)

hooks/
  useClientes.ts          TanStack Query hooks

types/index.ts            tipos globais

prisma/
  schema.prisma           schema completo
  seed.ts                 dados iniciais
```

## Próximos passos sugeridos

1. Implementar autenticação real no front (uso de `next-auth/react` `SessionProvider` + middleware).
2. Replicar o padrão do módulo **Clientes** para **Fornecedores**, **Serviços**, **Materiais**.
3. Implementar fluxo Lead → Atendimento → Visita → Orçamento → Contrato → Obra.
4. Plugar dados reais nos KPIs e gráficos do dashboard.
5. Upload de anexos (S3 ou storage local).
