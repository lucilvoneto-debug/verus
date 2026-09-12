export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { usuarioSchema } from "@/lib/validations/usuario";

/**
 * GET → usuários. Sem parâmetro devolve só ativos (formato antigo, usado nos
 * selects de responsável). Com ?todos=1 devolve lista completa com paginação.
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const todos = sp.get("todos") === "1";

  if (!todos) {
    const users = await prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(users);
  }

  const q = sp.get("q")?.trim();
  const role = sp.get("role");
  const ativo = sp.get("ativo");
  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  if (role) where.role = role;
  if (ativo === "true") where.active = true;
  if (ativo === "false") where.active = false;

  const data = await prisma.user.findMany({
    where,
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      colaborador: { select: { id: true, nome: true, funcao: true } },
      _count: { select: { auditLogs: true } },
    },
    take: 500,
  });
  return NextResponse.json({ data, total: data.length });
}

/** POST → cria usuário (senha obrigatória na criação). */
export async function POST(req: NextRequest) {
  const parsed = usuarioSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  if (!d.password) return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });

  const existe = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existe) return NextResponse.json({ error: "Já existe usuário com este e-mail" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      role: d.role,
      active: d.active,
      passwordHash: await bcrypt.hash(d.password, 10),
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
