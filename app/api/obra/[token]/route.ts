import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerTokenObra } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({ where: { chave: { startsWith: "empresa." } } });
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor])) as Record<string, string>;
  return {
    nome: map["empresa.nome"] || "Verus Impermeabilização",
    telefone: map["empresa.telefone"] || map["empresa.whatsapp"] || "",
  };
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const id = lerTokenObra(params.token);
  if (!id) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      cliente: { select: { nome: true } },
      etapas: { orderBy: { ordem: "asc" }, select: { nome: true, status: true, dataPrevista: true, dataRealizada: true } },
      diarios: {
        where: { visivelCliente: true },
        orderBy: { data: "desc" },
        take: 30,
        select: { data: true, etapa: true, descricao: true, m2: true, fotoUrl: true, fotos: true, condicaoTempo: true, percentualObra: true },
      },
    },
  });
  if (!obra) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });

  const total = obra.etapas.length;
  const concluidas = obra.etapas.filter((e) => e.status === "CONCLUIDA" || e.status === "CONCLUIDO").length;
  const pctEtapas = total ? Math.round((concluidas / total) * 100) : 0;
  const pctDiario = obra.diarios.find((d) => d.percentualObra != null)?.percentualObra ?? 0;
  const progresso = Math.max(pctEtapas, pctDiario);

  const empresa = await getEmpresa();

  return NextResponse.json({
    numero: obra.numero,
    nome: obra.nome,
    endereco: obra.endereco,
    status: obra.status,
    dataInicio: obra.dataInicio,
    previsaoTermino: obra.previsaoTermino,
    dataConclusao: obra.dataConclusao,
    cliente: obra.cliente,
    progresso,
    etapas: obra.etapas,
    diarios: obra.diarios,
    empresa,
  });
}
