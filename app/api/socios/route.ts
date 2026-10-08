import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extrato, resultado } from "@/lib/caixa/extrato";

export const dynamic = "force-dynamic";

const atual = (obs: string | null) => (obs ?? "").split("Antes:")[0];

/**
 * Quanto cada sócio colocou e tirou, o resultado da operação e o acerto entre eles
 * pela participação do contrato social.
 */
export async function GET() {
  const [socios, linhas, pagasPorSocio, recebidasPorSocio] = await Promise.all([
    prisma.socio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    extrato(),
    // Despesa da empresa que um sócio pagou do próprio bolso (anotada na conta a pagar).
    prisma.contaPagar.findMany({
      where: { valorPago: { gt: 0 }, observacoes: { not: null } },
      select: { valorPago: true, observacoes: true },
    }),
    // Pagamento de cliente que caiu na conta pessoal de um sócio: é dinheiro da empresa guardado com ele.
    prisma.contaReceber.findMany({
      where: { valorPago: { gt: 0 }, observacoes: { not: null } },
      select: { valorPago: true, observacoes: true },
    }),
  ]);

  const res = resultado(linhas);
  const movimentos = linhas.filter((l) => l.socioId);

  const totais = socios.map((s) => {
    const meus = movimentos.filter((m) => m.socioId === s.id);
    const soma = (cat: string, tipo: string) => meus.filter((m) => m.categoria === cat && m.tipo === tipo).reduce((t, m) => t + m.valor, 0);
    // Devolução de aporte é saída na categoria de aporte e reduz o que o sócio colocou.
    const aportou = soma("APORTE_SOCIO", "ENTRADA") - soma("APORTE_SOCIO", "SAIDA");
    const retirou = soma("RETIRADA_SOCIO", "SAIDA") - soma("RETIRADA_SOCIO", "ENTRADA");
    const primeiroNome = s.nome.split(" ")[0];
    // Retirada feita da conta pessoal do próprio sócio (ex.: "PicPay do Diego") saiu do dinheiro de cliente
    // que ficou com ele, que já entra em "recebeu de cliente": aparece na tela, mas não desconta de novo.
    const daContaDele = new RegExp(`d[oa] ${primeiroNome}`, "i");
    const retirouDoDinheiroDeCliente = meus
      .filter((m) => m.categoria === "RETIRADA_SOCIO" && m.tipo === "SAIDA" && m.conta && daContaDele.test(m.conta.nome))
      .reduce((t, m) => t + m.valor, 0);
    const pagouPelaEmpresa = pagasPorSocio
      // "devolvido"/"reembolsado" = a empresa já pagou de volta: não conta mais como dinheiro do sócio.
      // Só vale a anotação atual; o que vem depois de "Antes:" é o texto antigo guardado por histórico.
      .filter((p) => new RegExp(`(adiantado por|reembolso a|pago por) ${primeiroNome}`, "i").test(atual(p.observacoes)))
      .filter((p) => !/devolvid|reembolsad/i.test(atual(p.observacoes)))
      .reduce((t, p) => t + p.valorPago, 0);
    // O que a Verus deve ao sócio: o que ele pôs (em dinheiro ou pagando despesa da empresa) menos o que tirou
    // da empresa e menos o dinheiro de cliente que ficou na conta pessoal dele.
    // Não inclui a parte dele no resultado, que só vira dele quando os sócios decidirem distribuir.
    const recebeuDaEmpresa = recebidasPorSocio
      .filter((r) => new RegExp(`(picpay|conta|mercado pago) d[oa] ${primeiroNome}`, "i").test(r.observacoes ?? ""))
      .reduce((t, r) => t + r.valorPago, 0);
    const empresaDeve = aportou + pagouPelaEmpresa - (retirou - retirouDoDinheiroDeCliente) - recebeuDaEmpresa;
    const parteNoResultado = s.participacao != null ? res.resultado * s.participacao : null;
    return { ...s, aportou, retirou, retirouDoDinheiroDeCliente, pagouPelaEmpresa, recebeuDaEmpresa, empresaDeve, parteNoResultado };
  });

  return NextResponse.json({ socios: totais, movimentos, resultado: res });
}
