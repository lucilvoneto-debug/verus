import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extrato, resultado } from "@/lib/caixa/extrato";
import { acertoDoSocio } from "@/lib/socios/acerto";

export const dynamic = "force-dynamic";

/**
 * Quanto cada sócio investiu e recebeu de volta, o resultado da operação e o acerto entre eles
 * pela participação do contrato social.
 */
export async function GET() {
  const [socios, linhas, pagasPorSocio, recebidasPorSocio] = await Promise.all([
    prisma.socio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    extrato(),
    // Despesa da empresa que um sócio pagou do próprio bolso (anotada na conta a pagar).
    prisma.contaPagar.findMany({
      where: { valorPago: { gt: 0 }, observacoes: { not: null } },
      select: { id: true, valorPago: true, observacoes: true },
    }),
    // Pagamento de cliente que caiu na conta pessoal de um sócio: é dinheiro da empresa guardado com ele.
    prisma.contaReceber.findMany({
      where: { valorPago: { gt: 0 }, observacoes: { not: null } },
      select: { id: true, valorPago: true, observacoes: true },
    }),
  ]);

  const res = resultado(linhas);
  const movimentos = linhas.filter((l) => l.socioId);

  const totais = socios.map((s) => ({
    ...s,
    ...acertoDoSocio(s, linhas, pagasPorSocio, recebidasPorSocio),
    parteNoResultado: s.participacao != null ? res.resultado * s.participacao : null,
  }));

  return NextResponse.json({ socios: totais, movimentos, resultado: res });
}
