import type { LinhaExtrato } from "@/lib/caixa/extrato";

/** Só a anotação atual vale: o que vem depois de "Antes:" é o texto antigo guardado por histórico. */
const atual = (obs: string | null) => (obs ?? "").split("Antes:")[0];

export type ItemSocio = { id: string; data: Date; descricao: string; valor: number; forma: "DINHEIRO" | "DESPESA" | "REEMBOLSO" };
type Anotada = { id: string; valorPago: number; observacoes: string | null };

/**
 * Quanto um sócio investiu na Verus, quanto recebeu de volta e quanto a empresa ainda deve a ele,
 * com a lista de cada dinheiro que entrou e saiu.
 *  - Investiu = aporte em dinheiro + despesa da empresa paga do bolso dele (anotada na conta a pagar).
 *  - Recebeu de volta = saída na categoria de aporte (reembolso do que ele pôs).
 */
export function acertoDoSocio(
  socio: { id: string; nome: string },
  linhas: LinhaExtrato[],
  pagas: Anotada[],
  recebidas: Anotada[],
) {
  const meus = linhas.filter((l) => l.socioId === socio.id);
  const soma = (cat: string, tipo: string) => meus.filter((m) => m.categoria === cat && m.tipo === tipo).reduce((t, m) => t + m.valor, 0);
  const colocouEmDinheiro = soma("APORTE_SOCIO", "ENTRADA");
  const recebeuDeVolta = soma("APORTE_SOCIO", "SAIDA");
  const retirou = soma("RETIRADA_SOCIO", "SAIDA") - soma("RETIRADA_SOCIO", "ENTRADA");
  const primeiroNome = socio.nome.split(" ")[0];
  // Retirada feita da conta pessoal do próprio sócio (ex.: "PicPay do Diego") saiu do dinheiro de cliente
  // que ficou com ele, que já entra em "recebeu de cliente": aparece na tela, mas não desconta de novo.
  const daContaDele = new RegExp(`d[oa] ${primeiroNome}`, "i");
  const retirouDoDinheiroDeCliente = meus
    .filter((m) => m.categoria === "RETIRADA_SOCIO" && m.tipo === "SAIDA" && m.conta && daContaDele.test(m.conta.nome))
    .reduce((t, m) => t + m.valor, 0);
  // "devolvido"/"reembolsado" = a empresa já pagou de volta: não conta mais como dinheiro do sócio.
  const pagouEle = new RegExp(`(adiantado por|reembolso a|pago por) ${primeiroNome}`, "i");
  const pagasPorEle = pagas.filter((p) => pagouEle.test(atual(p.observacoes)) && !/devolvid|reembolsad/i.test(atual(p.observacoes)));
  const pagouPelaEmpresa = pagasPorEle.reduce((t, p) => t + p.valorPago, 0);
  // Pagamento de cliente que caiu na conta pessoal do sócio: é dinheiro da empresa guardado com ele.
  const recebeuDaEmpresa = recebidas
    .filter((r) => new RegExp(`(picpay|conta|mercado pago) d[oa] ${primeiroNome}`, "i").test(r.observacoes ?? ""))
    .reduce((t, r) => t + r.valorPago, 0);

  const investiu = colocouEmDinheiro + pagouPelaEmpresa;
  // Não inclui a parte dele no resultado, que só vira dele quando os sócios decidirem distribuir.
  const empresaDeve = investiu - recebeuDeVolta - (retirou - retirouDoDinheiroDeCliente) - recebeuDaEmpresa;

  const item = (l: LinhaExtrato, forma: ItemSocio["forma"]): ItemSocio => ({ id: l.id, data: l.data, descricao: l.descricao, valor: l.valor, forma });
  const porData = (a: ItemSocio, b: ItemSocio) => a.data.getTime() - b.data.getTime();
  const idsPagos = new Set(pagasPorEle.map((p) => p.id));
  const investimentos = [
    ...meus.filter((m) => m.categoria === "APORTE_SOCIO" && m.tipo === "ENTRADA").map((m) => item(m, "DINHEIRO")),
    ...linhas.filter((l) => l.origem === "CONTA_PAGAR" && idsPagos.has(l.id)).map((l) => item(l, "DESPESA")),
  ].sort(porData);
  const reembolsos = meus.filter((m) => m.categoria === "APORTE_SOCIO" && m.tipo === "SAIDA").map((m) => item(m, "REEMBOLSO")).sort(porData);

  return {
    investiu,
    colocouEmDinheiro,
    pagouPelaEmpresa,
    recebeuDeVolta,
    aportou: colocouEmDinheiro - recebeuDeVolta,
    retirou,
    retirouDoDinheiroDeCliente,
    recebeuDaEmpresa,
    empresaDeve,
    investimentos,
    reembolsos,
  };
}
