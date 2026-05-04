import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [contratos, garantias] = await Promise.all([
    prisma.contrato.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.garantia.findMany({
      where: { clienteId },
      orderBy: { dataInicio: "desc" },
      include: { obra: { select: { numero: true, nome: true } } },
    }),
  ]);

  return NextResponse.json({ contratos, garantias });
}
