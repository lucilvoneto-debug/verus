import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obraSchema, obraStatusSchema } from "@/lib/validations/obra";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const obra = await prisma.obra.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      responsavel: { select: { id: true, name: true, email: true } },
      contrato: { select: { id: true, numero: true, valor: true, status: true } },
      etapas: { orderBy: { ordem: "asc" } },
      diarios: {
        orderBy: { data: "desc" },
        include: { autor: { select: { id: true, name: true } } },
      },
      medicoes: { orderBy: { numero: "desc" } },
      alocacoes: {
        include: { colaborador: { select: { id: true, nome: true, funcao: true } } },
        orderBy: { dataInicio: "desc" },
      },
      movimentacoes: {
        where: { tipo: "SAIDA" },
        include: { material: { select: { id: true, nome: true, unidade: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!obra) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const totalEtapas = obra.etapas.length;
  const concluidas = obra.etapas.filter((e) => e.status === "CONCLUIDA").length;
  const progresso = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;

  const custoMateriais = obra.movimentacoes.reduce(
    (acc, m) => acc + m.quantidade * m.custoUnit,
    0
  );
  const custoEquipe = 0; // placeholder
  const custoTotal = custoMateriais + custoEquipe;
  const valorContrato = obra.contrato?.valor ?? 0;
  const margemReal = valorContrato - custoTotal;

  // fotos: agrupa de etapas + diarios (campos string CSV/JSON)
  const fotosEtapas: { origem: string; url: string; etapaId?: string }[] = [];
  for (const e of obra.etapas) {
    if (e.fotos) {
      try {
        const arr = JSON.parse(e.fotos);
        if (Array.isArray(arr)) {
          arr.forEach((url: string) =>
            fotosEtapas.push({ origem: `Etapa: ${e.nome}`, url, etapaId: e.id })
          );
        }
      } catch {
        e.fotos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((url) => fotosEtapas.push({ origem: `Etapa: ${e.nome}`, url, etapaId: e.id }));
      }
    }
  }
  for (const d of obra.diarios) {
    if (d.fotos) {
      try {
        const arr = JSON.parse(d.fotos);
        if (Array.isArray(arr)) {
          arr.forEach((url: string) => fotosEtapas.push({ origem: `Diário`, url }));
        }
      } catch {
        d.fotos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((url) => fotosEtapas.push({ origem: `Diário`, url }));
      }
    }
  }

  return NextResponse.json({
    ...obra,
    progresso,
    totalEtapas,
    etapasConcluidas: concluidas,
    custoMateriais,
    custoEquipe,
    custoTotal,
    valorContrato,
    margemReal,
    fotos: fotosEtapas,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // permite update apenas de status
  if (body && typeof body === "object" && Object.keys(body).length === 1 && "status" in body) {
    const parsedStatus = obraStatusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json(
        { error: "Status inválido", issues: parsedStatus.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await prisma.obra.update({
      where: { id: params.id },
      data: {
        status: parsedStatus.data.status,
        dataConclusao:
          parsedStatus.data.status === "FINALIZADA" ? new Date() : null,
      },
    });
    return NextResponse.json(updated);
  }

  const parsed = obraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const obra = await prisma.obra.update({
    where: { id: params.id },
    data: {
      contratoId: data.contratoId,
      clienteId: data.clienteId,
      nome: data.nome,
      endereco: data.endereco,
      responsavelId: data.responsavelId,
      dataInicio: new Date(data.dataInicio),
      previsaoTermino: new Date(data.previsaoTermino),
      status: data.status,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(obra);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.obra.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
