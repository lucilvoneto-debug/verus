import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICOS = [
  { nome: "Argamassa Polimérica Rígida 2kg/m²", preco: 20, area: 103.48 },
  { nome: "Argamassa Polimérica Rígida 3kg/m²", preco: 0, area: 36.44 },
  { nome: "Argamassa Polimérica Rígida 4kg/m²", preco: 0, area: 520.64 },
  { nome: "Argamassa Polimérica Flexível 3kg/m²", preco: 0, area: 3978.8 },
  { nome: "Argamassa Polimérica Rígida e Resina Termoplástica", preco: 0, area: 189.49 },
  {
    nome: "DUPLA manta asfáltica de poliéster aderida com asfalto, incluindo primer",
    preco: 0,
    area: 5290.48,
  },
  {
    nome: "DUPLA manta asfáltica de poliéster aderida com maçarico, incluindo primer",
    preco: 0,
    area: 210.68,
  },
  {
    nome: "Manta asfáltica de poliéster aderida com asfalto, incluindo primer",
    preco: 0,
    area: 702.31,
  },
  {
    nome: "Manta asfáltica de poliéster aderida com maçarico, incluindo primer",
    preco: 0,
    area: 155.25,
  },
  { nome: "Resina Epóxi", preco: 0, area: 71.91 },
];

async function main() {
  console.log("Configurações da empresa…");
  const empresaConfigs = [
    { chave: "empresa.nome", valor: "Verus Impermeabilizações" },
    { chave: "empresa.telefone", valor: "(82) 99166-9449 | (82) 99673-0005" },
    { chave: "empresa.email", valor: "verusimpermeabilizacoes@gmail.com" },
  ];
  for (const c of empresaConfigs) {
    await prisma.configuracao.upsert({
      where: { chave: c.chave },
      update: { valor: c.valor },
      create: c,
    });
  }

  console.log("Cliente TELESILMAIS…");
  const cliente = await prisma.cliente.upsert({
    where: { documento: "TELESILMAIS" },
    update: {},
    create: {
      tipo: "PJ",
      nome: "TELESILMAIS",
      documento: "TELESILMAIS",
      telefone: "(82) 99129-5944",
      logradouro: "R. Luís Lopes Agra",
      numero: "46",
      bairro: "Jatiúca",
      cidade: "Maceió",
      uf: "AL",
      categoria: "EMPRESA",
    },
  });

  console.log("Catálogo de serviços…");
  const servicosCriados: { id: string; nome: string }[] = [];
  for (const s of SERVICOS) {
    const created = await prisma.servico.upsert({
      where: { nome: s.nome }.nome ? { id: "x" } : { id: "x" }, // Prisma needs unique field; nome não é único
      update: {},
      create: {
        nome: s.nome,
        descricao: "",
        unidade: "M2",
        custoPadrao: 0,
        precoPadrao: s.preco,
        ativo: true,
      },
    }).catch(async () => {
      // Se Servico.nome não tem unique, tenta findFirst
      const found = await prisma.servico.findFirst({ where: { nome: s.nome } });
      if (found) return found;
      return prisma.servico.create({
        data: {
          nome: s.nome,
          descricao: "",
          unidade: "M2",
          custoPadrao: 0,
          precoPadrao: s.preco,
          ativo: true,
        },
      });
    });
    servicosCriados.push({ id: created.id, nome: created.nome });
  }

  console.log("Numerando orçamento…");
  const ano = new Date().getFullYear();
  const ultimo = await prisma.orcamento.findFirst({
    where: { numero: { startsWith: `ORC-${ano}-` } },
    orderBy: { numero: "desc" },
  });
  const seq = ultimo ? parseInt(ultimo.numero.split("-")[2] ?? "0", 10) + 1 : 1;
  const numero = `ORC-${ano}-${String(seq).padStart(4, "0")}`;

  console.log("Criando orçamento…");
  const subtotal = SERVICOS.reduce((acc, s) => acc + s.area * s.preco, 0);
  const desconto = 0;
  const total = subtotal - desconto;
  const custoEstimado = 0;
  const margemPrevista = total > 0 ? ((total - custoEstimado) / total) * 100 : 0;

  const validade = new Date();
  validade.setDate(validade.getDate() + 30);

  const observacoesMeta = JSON.stringify({
    obra: "EDF DOM ANTONIO",
    responsavel: "ENGº HENRIQUE RAMIRES",
    contato: "(82) 99129-5944",
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@verus.com.br" } });

  const orcamento = await prisma.orcamento.create({
    data: {
      numero,
      cliente: { connect: { id: cliente.id } },
      vendedor: { connect: { id: admin.id } },
      dataValidade: validade,
      status: "RASCUNHO",
      subtotal,
      desconto,
      total,
      custoEstimado,
      margemPrevista,
      condicaoPagamento: "À vista: Medições quinzenais.",
      prazoExecucao: "Conforme cronograma e liberação das áreas da obra.",
      observacoes: observacoesMeta,
      itens: {
        create: SERVICOS.map((s, idx) => ({
          servico: { connect: { id: servicosCriados[idx].id } },
          descricao: "",
          area: s.area,
          quantidade: s.area,
          unidade: "M2",
          custoUnit: 0,
          precoUnit: s.preco,
          subtotal: s.area * s.preco,
        })),
      },
    },
    include: { itens: true },
  });

  console.log("\n✓ Orçamento criado com sucesso.");
  console.log(`  Número: ${orcamento.numero}`);
  console.log(`  Cliente: ${cliente.nome}`);
  console.log(`  Itens: ${orcamento.itens.length}`);
  console.log(`  Total: R$ ${total.toFixed(2)}`);
  console.log(`  Acessar: /dashboard/orcamento/${orcamento.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
