# Deploy — Impermeia ERP no Vercel + Supabase (verus)

## 1. Pegar as connection strings no Supabase

1. Abre o projeto **verus** no Supabase
2. Clica no botão verde **Connect** no topo
3. Aba **ORMs** → seleciona **Prisma**
4. Copia as 2 strings que aparecem:
   - `DATABASE_URL` (porta 6543, com `?pgbouncer=true`)
   - `DIRECT_URL` (porta 5432)
5. Substitui `[YOUR-PASSWORD]` pela senha do banco (a que você definiu ao criar o projeto)

## 2. Aplicar o schema no Supabase (rodar localmente, 1 vez)

```bash
cd impermeia-erp

# Cole as strings reais no .env
cp .env.example .env
# editar .env com as strings do Supabase

# Aplicar schema no Postgres do verus
npx prisma db push

# Popular dados iniciais (admin, clientes, serviços, etc)
npm run db:seed
```

Depois disso o banco do Supabase tem todas as tabelas + dados de exemplo.

## 3. Subir código no GitHub

```bash
cd impermeia-erp
git init
git add .
git commit -m "Initial commit - Impermeia ERP"
gh repo create impermeia-erp --private --source=. --push
# OU criar repo manualmente em github.com e fazer push
```

## 4. Deploy no Vercel

1. Acessa [vercel.com](https://vercel.com) e faz login com GitHub
2. **Add New → Project** → seleciona `impermeia-erp`
3. Framework: Next.js (auto-detectado)
4. **Environment Variables** — adiciona estas 4:

| Nome             | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| `DATABASE_URL`   | (pooled, porta 6543, do Supabase)                              |
| `DIRECT_URL`     | (direct, porta 5432, do Supabase)                              |
| `NEXTAUTH_URL`   | https://SEU-APP.vercel.app (deixa em branco e edita depois)    |
| `NEXTAUTH_SECRET`| gere com `openssl rand -base64 32`                             |

5. **Deploy**
6. Após 1º deploy: copia a URL `https://...vercel.app` e edita `NEXTAUTH_URL` com o valor real → redeploy.

## 5. Testar

Abre `https://SEU-APP.vercel.app/login`

Login: `admin@impermeia.com.br` / `admin123`

## Atualizações futuras

Cada `git push` na branch `main` redeployа automaticamente. Pra mudanças de schema:

```bash
# alterar prisma/schema.prisma
npx prisma db push    # aplica no Supabase
git push              # redeployа Vercel com client atualizado
```
