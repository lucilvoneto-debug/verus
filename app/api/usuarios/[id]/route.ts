export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/sessao";
import { usuarioSchema } from "@/lib/validations/usuario";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, role: true, active: true, createdAt: true,
      colaborador: { select: { id: true, nome: true, funcao: true } },
    },
  });
  if (!u) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(u);
}

/** PUT → edita nome/e-mail/papel/ativo; senha só se vier preenchida. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = usuarioSchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const sessao = await sessaoAtual();

  // Não deixa o admin se rebaixar nem se desativar — evita trancar o sistema.
  if (sessao?.id === params.id) {
    if (d.role && d.role !== "ADMIN") return NextResponse.json({ error: "Você não pode remover seu próprio papel de administrador" }, { status: 400 });
    if (d.active === false) return NextResponse.json({ error: "Você não pode desativar a si mesmo" }, { status: 400 });
  }

  if (d.email) {
    const outro = await prisma.user.findFirst({ where: { email: d.email.toLowerCase(), NOT: { id: params.id } } });
    if (outro) return NextResponse.json({ error: "E-mail já usado por outro usuário" }, { status: 409 });
  }

  const u = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.email !== undefined ? { email: d.email.toLowerCase() } : {}),
      ...(d.role !== undefined ? { role: d.role } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return NextResponse.json(u);
}

/** DELETE → inativa (histórico tem FK para usuário; nunca apaga de verdade). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await sessaoAtual();
  if (sessao?.id === params.id) return NextResponse.json({ error: "Você não pode desativar a si mesmo" }, { status: 400 });
  await prisma.user.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
