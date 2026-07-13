import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando dados...");
  await prisma.itemCompra.deleteMany();
  await prisma.pedidoCompra.deleteMany();
  await prisma.movimentacaoEstoque.deleteMany();
  await prisma.servicoMaterial.deleteMany();
  await prisma.contaPagar.deleteMany();
  await prisma.contaReceber.deleteMany();
  await prisma.chamadoAssistencia.deleteMany();
  await prisma.garantia.deleteMany();
  await prisma.medicao.deleteMany();
  await prisma.diarioObra.deleteMany();
  await prisma.alocacaoEquipe.deleteMany();
  await prisma.pontoCampo.deleteMany();
  await prisma.etapa.deleteMany();
  await prisma.obra.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.orcamentoItem.deleteMany();
  await prisma.orcamento.deleteMany();
  await prisma.visita.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.colaborador.deleteMany();
  await prisma.material.deleteMany();
  await prisma.fabricante.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.clienteAcesso.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.anexo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.configuracao.deleteMany();

  console.log("Criando usuário admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@verus.com.br",
      passwordHash,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  const vendedor = await prisma.user.create({
    data: {
      email: "mariana@verus.com.br",
      passwordHash,
      name: "Mariana Lima",
      role: "COMERCIAL",
    },
  });

  const tecnico = await prisma.user.create({
    data: {
      email: "carlos@verus.com.br",
      passwordHash,
      name: "Carlos Mendes",
      role: "TECNICO",
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: "paulo@verus.com.br",
      passwordHash,
      name: "Paulo Rocha",
      role: "SUPERVISOR",
    },
  });

  console.log("Criando clientes...");
  const clientes = await Promise.all([
    prisma.cliente.create({ data: { tipo: "PF", nome: "Ana Beatriz Souza", documento: "12345678901", email: "ana@email.com", telefone: "11987654321", whatsapp: "11987654321", cep: "01310100", logradouro: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", categoria: "RESIDENCIAL" } }),
    prisma.cliente.create({ data: { tipo: "PF", nome: "Roberto Carvalho", documento: "98765432100", email: "roberto@email.com", telefone: "21988887777", cidade: "Rio de Janeiro", uf: "RJ", categoria: "RESIDENCIAL" } }),
    prisma.cliente.create({ data: { tipo: "PJ", nome: "Condomínio Vista Mar", documento: "12345678000190", email: "sindico@vistamar.com.br", telefone: "1133334444", cidade: "Santos", uf: "SP", categoria: "CONDOMINIO" } }),
    prisma.cliente.create({ data: { tipo: "PJ", nome: "Edifício Solaris", documento: "23456789000111", email: "adm@solaris.com.br", cidade: "Campinas", uf: "SP", categoria: "CONDOMINIO" } }),
    prisma.cliente.create({ data: { tipo: "PJ", nome: "Construtora Atlas Ltda.", documento: "34567890000122", email: "obras@atlas.com.br", telefone: "1144445555", cidade: "São Paulo", uf: "SP", categoria: "CONSTRUTORA" } }),
    prisma.cliente.create({ data: { tipo: "PJ", nome: "Indústria Norte SA", documento: "45678901000133", email: "manut@inorte.com.br", cidade: "Manaus", uf: "AM", categoria: "INDUSTRIA" } }),
    prisma.cliente.create({ data: { tipo: "PJ", nome: "Tech Center Empresarial", documento: "56789012000144", email: "facilities@techcenter.com.br", cidade: "Belo Horizonte", uf: "MG", categoria: "EMPRESA" } }),
    prisma.cliente.create({ data: { tipo: "PF", nome: "Marina Pessoa", documento: "11122233344", email: "marina@email.com", telefone: "31987651234", cidade: "Belo Horizonte", uf: "MG", categoria: "RESIDENCIAL" } }),
  ]);

  console.log("Criando serviços...");
  const servicosData = [
    { nome: "Manta asfáltica em laje", unidade: "M2" as const, custoPadrao: 45, precoPadrao: 110 },
    { nome: "Manta líquida poliuretânica", unidade: "M2" as const, custoPadrao: 38, precoPadrao: 95 },
    { nome: "Argamassa polimérica em piscina", unidade: "M2" as const, custoPadrao: 55, precoPadrao: 130 },
    { nome: "Impermeabilização de subsolo (cristalizante)", unidade: "M2" as const, custoPadrao: 60, precoPadrao: 145 },
    { nome: "Cobertura com manta acrílica", unidade: "M2" as const, custoPadrao: 32, precoPadrao: 78 },
    { nome: "Impermeabilização de fachada", unidade: "M2" as const, custoPadrao: 28, precoPadrao: 70 },
    { nome: "Vedação de juntas de dilatação", unidade: "METRO_LINEAR" as const, custoPadrao: 18, precoPadrao: 48 },
    { nome: "Calhas e rufos (manta + revestimento)", unidade: "METRO_LINEAR" as const, custoPadrao: 22, precoPadrao: 60 },
    { nome: "Tratamento de trincas em parede", unidade: "METRO_LINEAR" as const, custoPadrao: 15, precoPadrao: 42 },
    { nome: "Reservatório de água potável (epóxi)", unidade: "M2" as const, custoPadrao: 70, precoPadrao: 165 },
    { nome: "Diária técnica de aplicação", unidade: "DIARIA" as const, custoPadrao: 320, precoPadrao: 580 },
    { nome: "Vistoria pós-execução", unidade: "UNIDADE" as const, custoPadrao: 120, precoPadrao: 250 },
  ];
  const servicos = await Promise.all(
    servicosData.map((s) =>
      prisma.servico.create({ data: { ...s, tempoMedio: 1, descricao: s.nome } })
    )
  );

  console.log("Criando fornecedores...");
  const fornecedores = await Promise.all([
    prisma.fornecedor.create({ data: { nome: "Vedacit Distribuição", cnpj: "11111111000111", contato: "Comercial", email: "vendas@vedacit.com.br", telefone: "1133221100" } }),
    prisma.fornecedor.create({ data: { nome: "Sika Brasil", cnpj: "22222222000122", email: "atendimento@sika.com.br" } }),
    prisma.fornecedor.create({ data: { nome: "Quartzolit", cnpj: "33333333000133" } }),
    prisma.fornecedor.create({ data: { nome: "Bautech Ind. e Com.", cnpj: "44444444000144" } }),
    prisma.fornecedor.create({ data: { nome: "Otto Baumgart", cnpj: "55555555000155" } }),
  ]);

  console.log("Criando fabricantes...");
  const fabricantesData = [
    { nome: "Viapol", ativo: true, catalogoSincronizado: true, fispqUrl: "https://www.viapol.com.br/fispq", normasTecnicas: "NBR 9575/9574", garantiaAnosPadrao: 10 },
    { nome: "Sika", ativo: true, catalogoSincronizado: true, garantiaAnosPadrao: 15 },
    { nome: "Quartzolit", ativo: true, catalogoSincronizado: true, garantiaAnosPadrao: 8 },
    { nome: "Denver", ativo: true, catalogoSincronizado: false, observacoes: "ficha técnica pendente" },
    { nome: "Dryko", ativo: true, catalogoSincronizado: true },
    { nome: "Vedacit", ativo: true, catalogoSincronizado: true, normasTecnicas: "linha elastomérica" },
    { nome: "Bautech", ativo: true, catalogoSincronizado: false },
    { nome: "Icobit", ativo: true, catalogoSincronizado: true },
    { nome: "Soprema", ativo: true, catalogoSincronizado: true, normasTecnicas: "membrana líquida" },
  ];
  const fabricantes = await Promise.all(
    fabricantesData.map((f) => prisma.fabricante.create({ data: f }))
  );
  const fabricantePorNome = (nome: string) => fabricantes.find((f) => f.nome === nome)!;

  console.log("Criando materiais...");
  const materiaisData = [
    { nome: "Manta asfáltica 4mm", categoria: "Manta", unidade: "m2", custoMedio: 28, estoqueAtual: 320, estoqueMinimo: 100 },
    { nome: "Manta líquida PU 18kg", categoria: "Manta líquida", unidade: "balde", custoMedio: 480, estoqueAtual: 22, estoqueMinimo: 8, fabricanteId: fabricantePorNome("Sika").id },
    { nome: "Primer asfáltico 18L", categoria: "Primer", unidade: "balde", custoMedio: 220, estoqueAtual: 18, estoqueMinimo: 6, fabricanteId: fabricantePorNome("Viapol").id },
    { nome: "Argamassa polimérica 18kg", categoria: "Argamassa", unidade: "saco", custoMedio: 180, estoqueAtual: 45, estoqueMinimo: 15, fabricanteId: fabricantePorNome("Quartzolit").id },
    { nome: "Tela de poliéster 1m x 50m", categoria: "Tela", unidade: "rolo", custoMedio: 95, estoqueAtual: 30, estoqueMinimo: 10 },
    { nome: "Resina epóxi 5kg", categoria: "Resina", unidade: "balde", custoMedio: 210, estoqueAtual: 12, estoqueMinimo: 5 },
    { nome: "Selante PU 600ml", categoria: "Selante", unidade: "tubo", custoMedio: 38, estoqueAtual: 80, estoqueMinimo: 20 },
    { nome: "Vedante acrílico 18L", categoria: "Vedante", unidade: "balde", custoMedio: 260, estoqueAtual: 14, estoqueMinimo: 5 },
    { nome: "Cimento CP-II 50kg", categoria: "Cimento", unidade: "saco", custoMedio: 42, estoqueAtual: 60, estoqueMinimo: 20 },
    { nome: "Aditivo impermeabilizante 18L", categoria: "Aditivo", unidade: "balde", custoMedio: 175, estoqueAtual: 18, estoqueMinimo: 6 },
    { nome: "EPI - kit completo", categoria: "EPI", unidade: "kit", custoMedio: 240, estoqueAtual: 25, estoqueMinimo: 8 },
    { nome: "Trincha 4 polegadas", categoria: "Ferramenta", unidade: "un", custoMedio: 18, estoqueAtual: 45, estoqueMinimo: 15 },
    { nome: "Rolo de pelo médio 23cm", categoria: "Ferramenta", unidade: "un", custoMedio: 22, estoqueAtual: 38, estoqueMinimo: 15 },
    { nome: "Maçarico GLP", categoria: "Ferramenta", unidade: "un", custoMedio: 380, estoqueAtual: 8, estoqueMinimo: 3 },
    { nome: "Cristalizante 18kg", categoria: "Cristalizante", unidade: "balde", custoMedio: 320, estoqueAtual: 10, estoqueMinimo: 4 },
  ];
  await Promise.all(
    materiaisData.map((m, i) =>
      prisma.material.create({
        data: { ...m, fornecedorPadraoId: fornecedores[i % fornecedores.length].id },
      })
    )
  );

  console.log("Criando colaboradores...");
  await prisma.colaborador.create({ data: { nome: "Carlos Mendes", cpf: "10000000001", funcao: "TECNICO", custoHora: 45, custoDia: 360, userId: tecnico.id } });
  await prisma.colaborador.create({ data: { nome: "Paulo Rocha", cpf: "10000000002", funcao: "SUPERVISOR", custoHora: 60, custoDia: 480, userId: supervisor.id } });
  await prisma.colaborador.create({ data: { nome: "João Silva", cpf: "10000000003", funcao: "APLICADOR", custoHora: 32, custoDia: 256 } });
  await prisma.colaborador.create({ data: { nome: "Pedro Alves", cpf: "10000000004", funcao: "AJUDANTE", custoHora: 22, custoDia: 176 } });
  await prisma.colaborador.create({ data: { nome: "Mariana Lima", cpf: "10000000005", funcao: "VENDEDOR", custoHora: 50, custoDia: 400, userId: vendedor.id } });
  await prisma.colaborador.create({ data: { nome: "Eng. Renato Dias", cpf: "10000000006", funcao: "ENGENHEIRO", custoHora: 90, custoDia: 720 } });

  console.log("Criando leads...");
  await prisma.lead.create({ data: { clienteId: clientes[0].id, origem: "SITE", descricao: "Vazamento na laje da varanda", urgencia: "ALTA", status: "VISITA_AGENDADA", responsavelId: vendedor.id, proximaAcao: "Visita técnica", dataProximaAcao: new Date(Date.now() + 2 * 86400000) } });
  await prisma.lead.create({ data: { clienteId: clientes[2].id, origem: "INDICACAO", descricao: "Recuperação de cobertura do bloco A", urgencia: "MEDIA", status: "ORCAMENTO_ENVIADO", responsavelId: vendedor.id } });
  await prisma.lead.create({ data: { clienteId: clientes[4].id, origem: "WHATSAPP", descricao: "Subsolo do empreendimento Atlas Sky", urgencia: "ALTA", status: "NEGOCIACAO", responsavelId: vendedor.id } });
  await prisma.lead.create({ data: { origem: "GOOGLE", descricao: "Pintura impermeabilizante para casa", urgencia: "BAIXA", status: "NOVO", responsavelId: vendedor.id } });

  console.log("Criando visitas...");
  const visita1 = await prisma.visita.create({ data: { clienteId: clientes[0].id, tecnicoId: tecnico.id, endereco: "Av. Paulista, 1000 - SP", dataAgendada: new Date(Date.now() + 2 * 86400000), status: "AGENDADA", tipoSuperficie: "Laje exposta", causaProvavel: "Manta vencida", solucaoRecomendada: "Manta asfáltica 4mm + proteção mecânica" } });
  await prisma.visita.create({ data: { clienteId: clientes[2].id, tecnicoId: tecnico.id, endereco: "Vista Mar, Santos - SP", dataAgendada: new Date(Date.now() - 5 * 86400000), dataCheckIn: new Date(Date.now() - 5 * 86400000), dataCheckOut: new Date(Date.now() - 5 * 86400000 + 7200000), status: "CONCLUIDA", diagnostico: "Cobertura do bloco A com manta acrílica deteriorada" } });
  await prisma.visita.create({ data: { clienteId: clientes[4].id, tecnicoId: tecnico.id, endereco: "Atlas Sky - SP", dataAgendada: new Date(Date.now() - 10 * 86400000), status: "CONCLUIDA", diagnostico: "Necessária impermeabilização cristalizante no subsolo" } });

  console.log("Criando orçamentos...");
  const orc1 = await prisma.orcamento.create({
    data: {
      numero: "OR-2026-001",
      clienteId: clientes[2].id,
      visitaId: visita1.id,
      dataValidade: new Date(Date.now() + 30 * 86400000),
      status: "APROVADO",
      subtotal: 38500,
      total: 38500,
      custoEstimado: 16170,
      margemPrevista: 58,
      condicaoPagamento: "30/60/90",
      prazoExecucao: "20 dias úteis",
      vendedorId: vendedor.id,
      aprovadoEm: new Date(Date.now() - 7 * 86400000),
      itens: {
        create: [
          { servicoId: servicos[0].id, descricao: "Manta asfáltica - cobertura bloco A", area: 350, quantidade: 350, unidade: "m2", custoUnit: 45, precoUnit: 110, subtotal: 38500 },
        ],
      },
    },
  });

  const orc2 = await prisma.orcamento.create({
    data: {
      numero: "OR-2026-002",
      clienteId: clientes[4].id,
      dataValidade: new Date(Date.now() + 30 * 86400000),
      status: "APROVADO",
      subtotal: 87000,
      total: 87000,
      custoEstimado: 36000,
      margemPrevista: 58,
      condicaoPagamento: "Sinal 30% + 5x",
      prazoExecucao: "35 dias úteis",
      vendedorId: vendedor.id,
      aprovadoEm: new Date(Date.now() - 14 * 86400000),
      itens: {
        create: [
          { servicoId: servicos[3].id, descricao: "Cristalizante subsolo Atlas Sky", area: 600, quantidade: 600, unidade: "m2", custoUnit: 60, precoUnit: 145, subtotal: 87000 },
        ],
      },
    },
  });

  await prisma.orcamento.create({
    data: {
      numero: "OR-2026-003",
      clienteId: clientes[0].id,
      dataValidade: new Date(Date.now() + 30 * 86400000),
      status: "ENVIADO",
      subtotal: 5500,
      total: 5500,
      custoEstimado: 2250,
      margemPrevista: 59,
      vendedorId: vendedor.id,
      itens: {
        create: [
          { servicoId: servicos[1].id, descricao: "Manta líquida varanda - 50m2", area: 50, quantidade: 50, unidade: "m2", custoUnit: 38, precoUnit: 95, subtotal: 4750 },
          { servicoId: servicos[6].id, descricao: "Vedação de juntas - 15m", quantidade: 15, unidade: "m", custoUnit: 18, precoUnit: 48, subtotal: 720 },
        ],
      },
    },
  });

  console.log("Criando contratos e obras...");
  const contrato1 = await prisma.contrato.create({
    data: {
      numero: "CT-2026-001",
      orcamentoId: orc1.id,
      clienteId: clientes[2].id,
      valor: 38500,
      condicaoPagamento: "30/60/90",
      prazoExecucao: "20 dias úteis",
      garantiaMeses: 60,
      escopo: "Recuperação de cobertura do bloco A com manta asfáltica 4mm.",
      status: "ASSINADO",
      assinadoEm: new Date(Date.now() - 6 * 86400000),
      dataInicio: new Date(Date.now() - 5 * 86400000),
      dataFim: new Date(Date.now() + 25 * 86400000),
    },
  });

  const contrato2 = await prisma.contrato.create({
    data: {
      numero: "CT-2026-002",
      orcamentoId: orc2.id,
      clienteId: clientes[4].id,
      valor: 87000,
      condicaoPagamento: "Sinal 30% + 5x",
      prazoExecucao: "35 dias úteis",
      garantiaMeses: 60,
      escopo: "Impermeabilização cristalizante de subsolo do empreendimento Atlas Sky.",
      status: "ASSINADO",
      assinadoEm: new Date(Date.now() - 13 * 86400000),
      dataInicio: new Date(Date.now() - 12 * 86400000),
      dataFim: new Date(Date.now() + 30 * 86400000),
    },
  });

  const obra1 = await prisma.obra.create({
    data: {
      numero: "OB-2026-014",
      contratoId: contrato1.id,
      clienteId: clientes[2].id,
      nome: "Cobertura Vista Mar - Bloco A",
      endereco: "Av. Beira Mar, 200 - Santos - SP",
      responsavelId: tecnico.id,
      dataInicio: new Date(Date.now() - 5 * 86400000),
      previsaoTermino: new Date(Date.now() + 25 * 86400000),
      status: "EM_ANDAMENTO",
      custoReal: 9800,
    },
  });

  const obra2 = await prisma.obra.create({
    data: {
      numero: "OB-2026-012",
      contratoId: contrato2.id,
      clienteId: clientes[4].id,
      nome: "Subsolo Atlas Sky",
      endereco: "Rua das Acácias, 555 - SP",
      responsavelId: supervisor.id,
      dataInicio: new Date(Date.now() - 12 * 86400000),
      previsaoTermino: new Date(Date.now() - 2 * 86400000),
      status: "ATRASADA",
      custoReal: 28500,
    },
  });

  console.log("Criando etapas...");
  const checklistOk = JSON.stringify([
    { item: "Limpeza da superfície", done: true },
    { item: "Aplicação de primer", done: true },
    { item: "Manta asfáltica", done: false },
    { item: "Teste de estanqueidade", done: false },
  ]);
  await prisma.etapa.createMany({
    data: [
      { obraId: obra1.id, ordem: 1, nome: "Preparação", dataPrevista: new Date(Date.now() - 5 * 86400000), dataRealizada: new Date(Date.now() - 4 * 86400000), status: "CONCLUIDA", checklist: checklistOk },
      { obraId: obra1.id, ordem: 2, nome: "Aplicação da manta", dataPrevista: new Date(Date.now() + 1 * 86400000), status: "EM_ANDAMENTO", checklist: checklistOk },
      { obraId: obra1.id, ordem: 3, nome: "Proteção mecânica", dataPrevista: new Date(Date.now() + 10 * 86400000), status: "PENDENTE" },
      { obraId: obra1.id, ordem: 4, nome: "Teste de estanqueidade", dataPrevista: new Date(Date.now() + 18 * 86400000), status: "PENDENTE" },
      { obraId: obra2.id, ordem: 1, nome: "Mapeamento de infiltrações", dataPrevista: new Date(Date.now() - 12 * 86400000), dataRealizada: new Date(Date.now() - 11 * 86400000), status: "CONCLUIDA" },
      { obraId: obra2.id, ordem: 2, nome: "Aplicação cristalizante", dataPrevista: new Date(Date.now() - 5 * 86400000), status: "ATRASADA" },
      { obraId: obra2.id, ordem: 3, nome: "Vistoria final", dataPrevista: new Date(Date.now() + 5 * 86400000), status: "PENDENTE" },
    ],
  });

  console.log("Criando contas...");
  await prisma.contaReceber.createMany({
    data: [
      { clienteId: clientes[2].id, contratoId: contrato1.id, obraId: obra1.id, descricao: "Sinal CT-2026-001", valor: 11550, vencimento: new Date(Date.now() - 1 * 86400000), status: "PAGA", valorPago: 11550, formaPagamento: "PIX" },
      { clienteId: clientes[2].id, contratoId: contrato1.id, obraId: obra1.id, descricao: "30 dias CT-2026-001", valor: 11550, vencimento: new Date(Date.now() + 25 * 86400000), status: "ABERTA" },
      { clienteId: clientes[4].id, contratoId: contrato2.id, obraId: obra2.id, descricao: "2ª parcela CT-2026-002", valor: 17400, vencimento: new Date(Date.now() - 3 * 86400000), status: "ATRASADA" },
    ],
  });

  await prisma.contaPagar.createMany({
    data: [
      { fornecedorId: fornecedores[0].id, categoria: "Materiais", descricao: "NF Vedacit 22310", valor: 8400, vencimento: new Date(Date.now() + 7 * 86400000), status: "ABERTA" },
      { categoria: "Folha", descricao: "Salário equipe abr/26", valor: 22400, vencimento: new Date(Date.now() + 4 * 86400000), status: "ABERTA" },
      { categoria: "Despesas", descricao: "Aluguel galpão", valor: 6500, vencimento: new Date(Date.now() - 1 * 86400000), status: "PAGA", valorPago: 6500 },
    ],
  });

  console.log("Criando garantia...");
  const obraFin = await prisma.obra.findFirst();
  if (obraFin) {
    await prisma.garantia.create({
      data: {
        obraId: obra1.id,
        clienteId: clientes[2].id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 60 * 30 * 86400000),
        prazoMeses: 60,
        tipoGarantia: "Estanqueidade",
        condicoes: "Garantia contra infiltrações conforme NBR 9575.",
        status: "ATIVA",
      },
    });
  }

  console.log("Criando acessos de cliente para o portal...");
  const clienteSenhaHash = await bcrypt.hash("cliente123", 10);
  await prisma.clienteAcesso.create({
    data: {
      clienteId: clientes[2].id,
      email: clientes[2].email ?? "cliente1@verus.com.br",
      passwordHash: clienteSenhaHash,
      ativo: true,
    },
  });
  await prisma.clienteAcesso.create({
    data: {
      clienteId: clientes[4].id,
      email: clientes[4].email ?? "cliente2@verus.com.br",
      passwordHash: clienteSenhaHash,
      ativo: true,
    },
  });

  console.log("Configurações...");
  await prisma.configuracao.create({ data: { chave: "empresa.nome", valor: "Verus", descricao: "Nome da empresa" } });
  await prisma.configuracao.create({ data: { chave: "empresa.timezone", valor: "America/Sao_Paulo" } });

  console.log("Auditoria...");
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "SEED", entity: "system", entityId: "seed", payload: JSON.stringify({ when: new Date() }) },
  });

  console.log("Seed concluído com sucesso.");
  console.log("Login: admin@verus.com.br / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
