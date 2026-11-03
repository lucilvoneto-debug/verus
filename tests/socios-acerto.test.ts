import { describe, expect, it } from "vitest";
import type { LinhaExtrato } from "@/lib/caixa/extrato";
import { acertoDoSocio } from "@/lib/socios/acerto";

const lucilvo = { id: "s_lucilvo", nome: "Lucilvo Rocha de Melo Neto" };
const diego = { id: "s_diego", nome: "Diego Leite Basto Beltrão Vieira" };

const linha = (l: Partial<LinhaExtrato> & Pick<LinhaExtrato, "id" | "data" | "valor" | "tipo" | "categoria">): LinhaExtrato => ({
  origem: "LANCAMENTO",
  descricao: l.id,
  favorecido: null,
  fonte: null,
  incerto: false,
  conta: null,
  socio: null,
  socioId: null,
  obra: null,
  ...l,
});
const dia = (s: string) => new Date(`${s}T15:00:00Z`);

describe("acertoDoSocio", () => {
  const linhas: LinhaExtrato[] = [
    linha({ id: "material", data: dia("2026-07-16"), valor: 2845, tipo: "ENTRADA", categoria: "APORTE_SOCIO", socioId: lucilvo.id }),
    linha({ id: "dev1", data: dia("2026-10-20"), valor: 1300, tipo: "SAIDA", categoria: "APORTE_SOCIO", socioId: lucilvo.id }),
    linha({ id: "dev0", data: dia("2026-10-08"), valor: 4000, tipo: "SAIDA", categoria: "APORTE_SOCIO", socioId: lucilvo.id }),
    linha({ id: "farda", origem: "CONTA_PAGAR", data: dia("2026-03-31"), valor: 960, tipo: "SAIDA", categoria: "MATERIAL" }),
    linha({ id: "frete", origem: "CONTA_PAGAR", data: dia("2026-10-30"), valor: 1242.87, tipo: "SAIDA", categoria: "EQUIPAMENTO" }),
    linha({ id: "logo", origem: "CONTA_PAGAR", data: dia("2026-03-20"), valor: 75, tipo: "SAIDA", categoria: "MARKETING" }),
    linha({
      id: "retirada_picpay", data: dia("2026-07-01"), valor: 3165.69, tipo: "SAIDA", categoria: "RETIRADA_SOCIO",
      socioId: diego.id, conta: { id: "c1", nome: "PicPay do Diego" },
    }),
  ];
  const pagas = [
    { id: "farda", valorPago: 960, observacoes: "Pago por Lucilvo (dito). Antes: Adiantado por Diego" },
    { id: "frete", valorPago: 1242.87, observacoes: "Pago por Lucilvo em 30/10/2026 (comprovante Bradesco)" },
    { id: "logo", valorPago: 75, observacoes: "Pago por Lucilvo e devolvido no mesmo dia" },
  ];
  const recebidas = [{ id: "aguiar", valorPago: 11610.5, observacoes: "Caiu no PicPay do Diego" }];

  it("separa o que o sócio investiu do que recebeu de volta", () => {
    const a = acertoDoSocio(lucilvo, linhas, pagas, recebidas);
    expect(a.colocouEmDinheiro).toBe(2845);
    expect(a.pagouPelaEmpresa).toBeCloseTo(2202.87, 2);
    expect(a.investiu).toBeCloseTo(5047.87, 2);
    expect(a.recebeuDeVolta).toBe(5300);
    expect(a.empresaDeve).toBeCloseTo(-252.13, 2);
    expect(a.recebeuDaEmpresa).toBe(0);
  });

  it("lista cada investimento e reembolso em ordem de data, sem o que já foi devolvido", () => {
    const a = acertoDoSocio(lucilvo, linhas, pagas, recebidas);
    expect(a.investimentos.map((i) => [i.id, i.forma])).toEqual([["farda", "DESPESA"], ["material", "DINHEIRO"], ["frete", "DESPESA"]]);
    expect(a.reembolsos.map((i) => i.id)).toEqual(["dev0", "dev1"]);
  });

  it("retirada do dinheiro de cliente que estava com o sócio não desconta duas vezes", () => {
    const a = acertoDoSocio(diego, linhas, pagas, recebidas);
    expect(a.investiu).toBe(0);
    expect(a.retirou).toBeCloseTo(3165.69, 2);
    expect(a.retirouDoDinheiroDeCliente).toBeCloseTo(3165.69, 2);
    expect(a.recebeuDaEmpresa).toBe(11610.5);
    expect(a.empresaDeve).toBeCloseTo(-11610.5, 2);
  });
});
