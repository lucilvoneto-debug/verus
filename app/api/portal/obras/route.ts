import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const obras = await prisma.obra.findMany({
    where: { clienteId },
    orderBy: { dataInicio: "desc" },
  });
  return NextResponse.json(obras);
}
