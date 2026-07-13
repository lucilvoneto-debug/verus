/**
 * Motor de orçamento — calcula custo e preço de um Serviço a partir dos
 * materiais vinculados (ServicoMaterial) e das taxas de overhead do próprio
 * Serviço (perdas, mão de obra, equipamentos, EPI/transporte, BDI, impostos,
 * lucro).
 *
 * Puro: nenhuma chamada a Prisma/rede/IO aqui — só matemática determinística.
 * Mesma filosofia de lib/impermeabilizacao/regras.ts: funções + interfaces,
 * fáceis de testar isoladamente.
 */

export interface ItemMaterialCalculo {
  materialId: string;
  nome: string;
  unidade: string; // Material.unidade
  quantidadePorUnidade: number; // ServicoMaterial.quantidade
  precoUnitario: number; // Material.precoMedio ?? Material.custoMedio
}

export interface ServicoParaCalculo {
  unidade: string;
  percaPercent?: number | null;
  maoDeObraPorUnidade?: number | null;
  equipamentosPorUnidade?: number | null;
  episTransportePorUnidade?: number | null;
  bdiPercent?: number | null;
  impostosPercent?: number | null;
  lucroPercent?: number | null;
}

export interface LinhaCalculo {
  label: string;
  valor: number;
}

export interface ResultadoCalculo {
  quantidade: number;
  linhasMateriais: LinhaCalculo[];
  materiaisSubtotal: number;
  perdas: LinhaCalculo;
  equipamentos: LinhaCalculo;
  maoDeObra: LinhaCalculo;
  episTransporte: LinhaCalculo;
  /** materiais + perdas + maoDeObra + equipamentos + episTransporte */
  custoDireto: number;
  bdi: LinhaCalculo;
  impostos: LinhaCalculo;
  lucro: LinhaCalculo;
  /** custoDireto + bdi + impostos + lucro */
  precoTotal: number;
  /** custoDireto / quantidade */
  custoUnit: number;
  /** precoTotal / quantidade */
  precoUnit: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function zerado(): ResultadoCalculo {
  return {
    quantidade: 0,
    linhasMateriais: [],
    materiaisSubtotal: 0,
    perdas: { label: "Perdas/sobreposição", valor: 0 },
    equipamentos: { label: "Equipamentos", valor: 0 },
    maoDeObra: { label: "Mão de obra", valor: 0 },
    episTransporte: { label: "EPIs + transporte", valor: 0 },
    custoDireto: 0,
    bdi: { label: "BDI", valor: 0 },
    impostos: { label: "Impostos", valor: 0 },
    lucro: { label: "Lucro", valor: 0 },
    precoTotal: 0,
    custoUnit: 0,
    precoUnit: 0,
  };
}

export function calcularServico(
  servico: ServicoParaCalculo,
  materiais: ItemMaterialCalculo[],
  quantidade: number
): ResultadoCalculo {
  if (!quantidade || quantidade <= 0) {
    return zerado();
  }

  const linhasMateriais: LinhaCalculo[] = materiais.map((m) => ({
    label: m.nome,
    valor: round2(m.quantidadePorUnidade * quantidade * m.precoUnitario),
  }));
  const materiaisSubtotal = round2(linhasMateriais.reduce((s, l) => s + l.valor, 0));

  const perdasValor = round2(materiaisSubtotal * (servico.percaPercent ?? 0));
  const maoDeObraValor = round2((servico.maoDeObraPorUnidade ?? 0) * quantidade);
  const equipamentosValor = round2((servico.equipamentosPorUnidade ?? 0) * quantidade);
  const episTransporteValor = round2((servico.episTransportePorUnidade ?? 0) * quantidade);

  const custoDireto = round2(
    materiaisSubtotal + perdasValor + maoDeObraValor + equipamentosValor + episTransporteValor
  );

  const bdiValor = round2(custoDireto * (servico.bdiPercent ?? 0));
  const impostosValor = round2((custoDireto + bdiValor) * (servico.impostosPercent ?? 0));
  const lucroValor = round2((custoDireto + bdiValor + impostosValor) * (servico.lucroPercent ?? 0));

  const precoTotal = round2(custoDireto + bdiValor + impostosValor + lucroValor);

  const custoUnit = round2(custoDireto / quantidade);
  const precoUnit = round2(precoTotal / quantidade);

  return {
    quantidade,
    linhasMateriais,
    materiaisSubtotal,
    perdas: { label: "Perdas/sobreposição", valor: perdasValor },
    equipamentos: { label: "Equipamentos", valor: equipamentosValor },
    maoDeObra: { label: "Mão de obra", valor: maoDeObraValor },
    episTransporte: { label: "EPIs + transporte", valor: episTransporteValor },
    custoDireto,
    bdi: { label: "BDI", valor: bdiValor },
    impostos: { label: "Impostos", valor: impostosValor },
    lucro: { label: "Lucro", valor: lucroValor },
    precoTotal,
    custoUnit,
    precoUnit,
  };
}
