import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().email().optional(),
  senha: z.string().min(6).max(120).optional(),
});

const patchSchema = z.object({
  acao: z.enum(["RESET_SENHA", "DESATIVAR", "ATIVAR"]),
  senha: z.string().min(6).max(120).optional(),
});

function gerarSenha(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const acesso = await prisma.clienteAcesso.findUnique({
    where: { clienteId: params.id },
    select: {
      id: true,
      email: true,
      ativo: true,
      ultimoLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(acesso);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    select: { id: true, email: true },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const existing = await prisma.clienteAcesso.findUnique({
    where: { clienteId: cliente.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Acesso já existe" }, { status: 409 });
  }

  const email = parsed.data.email ?? cliente.email;
  if (!email) {
    return NextResponse.json(
      { error: "Cliente sem e-mail. Informe um e-mail." },
      { status: 400 }
    );
  }

  const senhaPlain = parsed.data.senha ?? gerarSenha();
  const passwordHash = await bcrypt.hash(senhaPlain, 10);

  const acesso = await prisma.clienteAcesso.create({
    data: {
      clienteId: cliente.id,
      email,
      passwordHash,
      ativo: true,
    },
  });

  return NextResponse.json({
    id: acesso.id,
    email: acesso.email,
    ativo: acesso.ativo,
    senhaTemporaria: senhaPlain,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const acesso = await prisma.clienteAcesso.findUnique({
    where: { clienteId: params.id },
  });
  if (!acesso) return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });

  if (parsed.data.acao === "DESATIVAR") {
    const upd = await prisma.clienteAcesso.update({
      where: { id: acesso.id },
      data: { ativo: false },
    });
    return NextResponse.json({ id: upd.id, ativo: upd.ativo });
  }
  if (parsed.data.acao === "ATIVAR") {
    const upd = await prisma.clienteAcesso.update({
      where: { id: acesso.id },
      data: { ativo: true },
    });
    return NextResponse.json({ id: upd.id, ativo: upd.ativo });
  }
  // RESET_SENHA
  const senhaPlain = parsed.data.senha ?? gerarSenha();
  const passwordHash = await bcrypt.hash(senhaPlain, 10);
  await prisma.clienteAcesso.update({
    where: { id: acesso.id },
    data: { passwordHash },
  });
  return NextResponse.json({ senhaTemporaria: senhaPlain });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const acesso = await prisma.clienteAcesso.findUnique({ where: { clienteId: params.id } });
  if (!acesso) return NextResponse.json({ ok: true });
  await prisma.clienteAcesso.delete({ where: { id: acesso.id } });
  return NextResponse.json({ ok: true });
}
