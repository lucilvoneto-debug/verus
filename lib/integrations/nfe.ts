/**
 * Adapter de emissão de NF-e/NFS-e (NFe.io, eNotas, etc).
 *
 * TODO: trocar por chamada real ao provedor.
 * Variáveis de env necessárias:
 *   NFE_PROVIDER -> "nfeio" | "enotas" | "none"
 *   NFE_TOKEN    -> chave de API
 *
 * Campos necessários no payload (a obter da Obra/Medicao):
 *   - chave (NFS-e: gerada pela prefeitura)
 *   - número e série
 *   - valor total do serviço
 *   - prestador (CNPJ, IM, endereço)
 *   - tomador (CPF/CNPJ, endereço, e-mail)
 *   - serviço: CNAE, item lista de serviços (LC 116/03), descrição
 *   - alíquotas (ISS, retenções de IRRF, INSS, PIS/COFINS/CSLL)
 */

import { prisma } from "../prisma";

export type EmitirNFEInput = {
  obraId: string;
  medicaoId?: string | null;
};

export type EmitirNFEResult = {
  ok: boolean;
  numero?: string;
  chave?: string;
  url?: string;
  error?: string;
  mock?: boolean;
};

export async function emitirNFE(input: EmitirNFEInput): Promise<EmitirNFEResult> {
  const provider = (process.env.NFE_PROVIDER ?? "none").toLowerCase();
  const token = process.env.NFE_TOKEN ?? "";

  // Sanity check — obra precisa existir.
  const obra = await prisma.obra.findUnique({
    where: { id: input.obraId },
    select: { id: true, numero: true, clienteId: true },
  });
  if (!obra) {
    return { ok: false, error: "Obra não encontrada" };
  }

  if (provider === "none" || !token) {
    console.log("[nfe:mock] emitir para obra", obra.numero, "medicao", input.medicaoId);
    return {
      ok: true,
      mock: true,
      numero: `MOCK-${Date.now()}`,
      chave: `MOCK-CHAVE-${obra.numero}`,
      url: "https://example.invalid/nfe/mock.pdf",
    };
  }

  // TODO: implementar chamada real:
  //   - montar payload com prestador, tomador, serviço, valores e alíquotas
  //   - POST /v1/companies/{cnpj}/serviceinvoices  (NFe.io)
  //   - autenticação via header `Authorization: Basic base64(token:)`
  return {
    ok: false,
    error: `Provider ${provider} ainda não implementado — ver TODOs em lib/integrations/nfe.ts`,
  };
}

export function nfeStatus(): { provider: string; connected: boolean } {
  const provider = (process.env.NFE_PROVIDER ?? "none").toLowerCase();
  const connected = provider !== "none" && !!process.env.NFE_TOKEN;
  return { provider, connected };
}
