import { prisma } from "@/lib/prisma";
import { chaveMedicao, juntaMedicao, leMedicao, type Medicao3D, type Obra3D } from "@/lib/obras/obra3d";

/** Medição gravada da página 3D (tabela Configuracao). */
export async function medicaoDaObra(obra: Obra3D): Promise<Medicao3D> {
  const row = await prisma.configuracao.findUnique({ where: { chave: chaveMedicao(obra.slug) } });
  return leMedicao(row?.valor);
}

/** Junta o que a página mandou com o que já estava gravado e devolve o resultado. */
export async function gravaMedicaoDaObra(obra: Obra3D, patch: unknown): Promise<Medicao3D> {
  const chave = chaveMedicao(obra.slug);
  return prisma.$transaction(async (tx) => {
    const row = await tx.configuracao.findUnique({ where: { chave } });
    const novo = juntaMedicao(leMedicao(row?.valor), patch);
    const valor = JSON.stringify(novo);
    await tx.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor, descricao: `Medição marcada na página 3D: ${obra.titulo}` },
    });
    return novo;
  });
}
