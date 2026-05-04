import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando dados fictícios...");

  // Ordem importa por FKs. Filhas antes das mães.
  await prisma.$transaction([
    prisma.notificacao.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.anexo.deleteMany(),
    prisma.chamadoAssistencia.deleteMany(),
    prisma.garantia.deleteMany(),
    prisma.contaPagar.deleteMany(),
    prisma.contaReceber.deleteMany(),
    prisma.medicao.deleteMany(),
    prisma.diarioObra.deleteMany(),
    prisma.etapa.deleteMany(),
    prisma.alocacaoEquipe.deleteMany(),
    prisma.pontoCampo.deleteMany(),
    prisma.obra.deleteMany(),
    prisma.contrato.deleteMany(),
    prisma.orcamentoItem.deleteMany(),
    prisma.orcamento.deleteMany(),
    prisma.itemCompra.deleteMany(),
    prisma.pedidoCompra.deleteMany(),
    prisma.movimentacaoEstoque.deleteMany(),
    prisma.servicoMaterial.deleteMany(),
    prisma.material.deleteMany(),
    prisma.fornecedor.deleteMany(),
    prisma.servico.deleteMany(),
    prisma.visita.deleteMany(),
    prisma.atendimento.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.colaborador.deleteMany(),
    prisma.clienteAcesso.deleteMany(),
    prisma.cliente.deleteMany(),
    // Mantém apenas o admin
    prisma.user.deleteMany({ where: { email: { not: "admin@verus.com.br" } } }),
    // Configurações (empresa.*) ficam intocadas
  ]);

  const totals = {
    users: await prisma.user.count(),
    configs: await prisma.configuracao.count(),
  };

  console.log("Banco limpo.");
  console.log("Restaram:");
  console.log(`  Usuários: ${totals.users} (admin)`);
  console.log(`  Configurações: ${totals.configs}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
