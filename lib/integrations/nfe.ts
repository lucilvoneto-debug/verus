/**
 * Emissão de NFS-e (nota de serviço) por provedor.
 *
 *   NFE_PROVIDER      "nfeio" | "enotas" | "none"
 *   NFE_TOKEN         chave de API do provedor
 *   NFE_COMPANY_ID    id da empresa no provedor (NFe.io: company id; eNotas: empresaId)
 *   NFE_SERVICE_CODE  código do serviço municipal (LC 116 — impermeabilização costuma ser 7.02 / 7.05)
 *   NFE_ISS_RATE      alíquota ISS em % (opcional; o provedor pode calcular)
 *
 * Sem provedor/token → mock (devolve número MOCK-…). As duas APIs são assíncronas:
 * a nota fica "processando" e o provedor devolve o PDF/número depois; guardamos
 * o id retornado em Medicao.observacoes / AuditLog para consulta.
 *
 * Referências:
 *   NFe.io  POST https://api.nfe.io/v1/companies/{company_id}/serviceinvoices   (Authorization: Basic {apikey})
 *   eNotas  POST https://api.enotasgw.com.br/v1/empresas/{empresaId}/nfes         (Authorization: Basic {apikey})
 */

import { prisma } from "../prisma";

export type EmitirNFEInput = {
  obraId: string;
  medicaoId?: string | null;
  /** Sobrescreve o valor (padrão: valor da medição, senão valor do contrato). */
  valor?: number | null;
  descricao?: string | null;
};

export type EmitirNFEResult = {
  ok: boolean;
  numero?: string;
  chave?: string;
  url?: string;
  idProvedor?: string;
  status?: string;
  error?: string;
  mock?: boolean;
};

type Provedor = "nfeio" | "enotas" | "none";

function provedor(): Provedor {
  const p = (process.env.NFE_PROVIDER ?? "none").toLowerCase();
  return p === "nfeio" || p === "enotas" ? p : "none";
}

export function nfeStatus(): { provider: string; connected: boolean } {
  const p = provedor();
  return { provider: p, connected: p !== "none" && !!process.env.NFE_TOKEN && !!process.env.NFE_COMPANY_ID };
}

function soDigitos(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D+/g, "");
}

async function montarPayloadBase(input: EmitirNFEInput) {
  const obra = await prisma.obra.findUnique({
    where: { id: input.obraId },
    include: {
      cliente: true,
      contrato: { select: { numero: true, valor: true, escopo: true } },
      medicoes: input.medicaoId ? { where: { id: input.medicaoId } } : { where: { id: "-" } },
    },
  });
  if (!obra) return { erro: "Obra não encontrada" as const };

  const medicao = obra.medicoes[0] ?? null;
  const valor = input.valor ?? medicao?.valor ?? obra.contrato?.valor ?? 0;
  if (valor <= 0) return { erro: "Valor da nota é zero — informe medição ou valor." as const };

  const descricao =
    input.descricao?.trim() ||
    `Serviços de impermeabilização — obra ${obra.numero} (${obra.nome})` +
      (medicao ? ` — medição nº ${medicao.numero} (${medicao.percentualExecutado}% executado)` : "") +
      (obra.contrato ? ` — contrato ${obra.contrato.numero}` : "");

  const c = obra.cliente;
  const doc = soDigitos(c.documento);
  const tomador = {
    nome: c.nome,
    documento: doc,
    tipo: doc.length === 14 ? "PJ" : "PF",
    email: c.email ?? undefined,
    telefone: soDigitos(c.whatsapp ?? c.telefone),
    endereco: {
      cep: soDigitos(c.cep),
      logradouro: c.logradouro ?? "",
      numero: c.numero ?? "S/N",
      complemento: c.complemento ?? undefined,
      bairro: c.bairro ?? "",
      cidade: c.cidade ?? "",
      uf: c.uf ?? "",
    },
  };

  return { obra, medicao, valor, descricao, tomador };
}

async function registrar(obraId: string, medicaoId: string | null, resultado: EmitirNFEResult) {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, select: { id: true } });
  if (admin) {
    await prisma.auditLog.create({
      data: { userId: admin.id, action: "NFE_EMITIR", entity: "Obra", entityId: obraId, payload: JSON.stringify({ medicaoId, ...resultado }) },
    }).catch(() => undefined);
  }
  if (medicaoId && resultado.ok) {
    await prisma.medicao.update({
      where: { id: medicaoId },
      data: {
        status: "FATURADA",
        faturadoEm: new Date(),
        observacoes: `NF ${resultado.numero ?? resultado.idProvedor ?? ""}${resultado.url ? ` · ${resultado.url}` : ""}`,
      },
    }).catch(() => undefined);
  }
}

// ─── NFe.io ───────────────────────────────────────────────────────────────────

async function emitirNfeIo(base: NonNullable<Awaited<ReturnType<typeof montarPayloadBase>>> & { erro?: undefined }): Promise<EmitirNFEResult> {
  const token = process.env.NFE_TOKEN!;
  const company = process.env.NFE_COMPANY_ID!;
  const issRate = process.env.NFE_ISS_RATE ? Number(process.env.NFE_ISS_RATE) / 100 : undefined;
  const { tomador, valor, descricao } = base;

  const payload = {
    cityServiceCode: process.env.NFE_SERVICE_CODE ?? "0702",
    description: descricao,
    servicesAmount: Math.round(valor * 100) / 100,
    ...(issRate !== undefined ? { issRate } : {}),
    borrower: {
      type: tomador.tipo === "PJ" ? "LegalEntity" : "NaturalPerson",
      name: tomador.nome,
      federalTaxNumber: Number(tomador.documento) || undefined,
      email: tomador.email,
      address: {
        country: "BRA",
        postalCode: tomador.endereco.cep,
        street: tomador.endereco.logradouro,
        number: tomador.endereco.numero,
        additionalInformation: tomador.endereco.complemento,
        district: tomador.endereco.bairro,
        city: { name: tomador.endereco.cidade },
        state: tomador.endereco.uf,
      },
    },
  };

  const r = await fetch(`https://api.nfe.io/v1/companies/${company}/serviceinvoices`, {
    method: "POST",
    headers: { Authorization: `Basic ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const texto = await r.text();
  let d: any = {};
  try {
    d = texto ? JSON.parse(texto) : {};
  } catch {
    d = { raw: texto };
  }
  if (!r.ok) return { ok: false, error: d?.message || d?.error || `NFe.io ${r.status}: ${texto.slice(0, 200)}` };

  // 202 = aceita p/ processamento; o corpo pode vir vazio com Location no header.
  const id = d?.id ?? r.headers.get("location")?.split("/").pop() ?? undefined;
  return {
    ok: true,
    idProvedor: id,
    numero: d?.number ? String(d.number) : undefined,
    chave: d?.checkCode ?? undefined,
    url: d?.pdf?.url ?? (id ? `https://api.nfe.io/v1/companies/${company}/serviceinvoices/${id}/pdf` : undefined),
    status: d?.flowStatus ?? (r.status === 202 ? "processando" : "emitida"),
  };
}

// ─── eNotas ───────────────────────────────────────────────────────────────────

async function emitirEnotas(base: NonNullable<Awaited<ReturnType<typeof montarPayloadBase>>> & { erro?: undefined }): Promise<EmitirNFEResult> {
  const token = process.env.NFE_TOKEN!;
  const empresaId = process.env.NFE_COMPANY_ID!;
  const { tomador, valor, descricao, obra, medicao } = base;
  const issRate = process.env.NFE_ISS_RATE ? Number(process.env.NFE_ISS_RATE) : undefined;

  const payload = {
    tipo: "NFS-e",
    idExterno: medicao ? `medicao-${medicao.id}` : `obra-${obra.id}-${Date.now()}`,
    ambienteEmissao: process.env.NFE_AMBIENTE === "homologacao" ? "Homologacao" : "Producao",
    enviarPorEmail: !!tomador.email,
    cliente: {
      tipoPessoa: tomador.tipo === "PJ" ? "J" : "F",
      nome: tomador.nome,
      email: tomador.email,
      cpfCnpj: tomador.documento,
      telefone: tomador.telefone || undefined,
      endereco: {
        pais: "Brasil",
        uf: tomador.endereco.uf,
        cidade: tomador.endereco.cidade,
        logradouro: tomador.endereco.logradouro,
        numero: tomador.endereco.numero,
        complemento: tomador.endereco.complemento,
        bairro: tomador.endereco.bairro,
        cep: tomador.endereco.cep,
      },
    },
    servico: {
      descricao,
      ...(process.env.NFE_SERVICE_CODE ? { codigoServicoMunicipio: process.env.NFE_SERVICE_CODE } : {}),
      ...(issRate !== undefined ? { aliquotaIss: issRate } : {}),
      valorUnitario: Math.round(valor * 100) / 100,
      quantidade: 1,
    },
  };

  const r = await fetch(`https://api.enotasgw.com.br/v1/empresas/${empresaId}/nfes`, {
    method: "POST",
    headers: { Authorization: `Basic ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const texto = await r.text();
  let d: any = {};
  try {
    d = texto ? JSON.parse(texto) : {};
  } catch {
    d = { raw: texto };
  }
  if (!r.ok) {
    const msg = Array.isArray(d) ? d.map((e: any) => e?.mensagem ?? e?.message).filter(Boolean).join("; ") : d?.mensagem || d?.message;
    return { ok: false, error: msg || `eNotas ${r.status}: ${texto.slice(0, 200)}` };
  }
  const id = d?.nfeId ?? d?.id ?? (typeof d === "string" ? d : undefined);
  return {
    ok: true,
    idProvedor: id,
    status: "processando",
    url: id ? `https://api.enotasgw.com.br/v1/empresas/${empresaId}/nfes/${id}/pdf` : undefined,
  };
}

// ─── Entrada ──────────────────────────────────────────────────────────────────

export async function emitirNFE(input: EmitirNFEInput): Promise<EmitirNFEResult> {
  const base = await montarPayloadBase(input);
  if ("erro" in base && base.erro) return { ok: false, error: base.erro };
  const b = base as Exclude<typeof base, { erro: string }>;

  const p = provedor();
  const token = process.env.NFE_TOKEN ?? "";
  const company = process.env.NFE_COMPANY_ID ?? "";

  let resultado: EmitirNFEResult;
  if (p === "none" || !token || !company) {
    console.log("[nfe:mock] emitir", { obra: b.obra.numero, medicao: input.medicaoId, valor: b.valor });
    resultado = {
      ok: true,
      mock: true,
      numero: `MOCK-${Date.now()}`,
      chave: `MOCK-CHAVE-${b.obra.numero}`,
      url: "https://example.invalid/nfe/mock.pdf",
      status: "mock",
    };
  } else {
    try {
      resultado = p === "nfeio" ? await emitirNfeIo(b) : await emitirEnotas(b);
    } catch (e) {
      resultado = { ok: false, error: e instanceof Error ? e.message : "falha na emissão" };
    }
  }

  await registrar(input.obraId, input.medicaoId ?? null, resultado);
  return resultado;
}

/** Consulta o status/PDF de uma nota já enviada (id do provedor). */
export async function consultarNFE(idProvedor: string): Promise<EmitirNFEResult> {
  const p = provedor();
  const token = process.env.NFE_TOKEN ?? "";
  const company = process.env.NFE_COMPANY_ID ?? "";
  if (p === "none" || !token || !company) return { ok: false, error: "NF-e não configurada" };
  const url =
    p === "nfeio"
      ? `https://api.nfe.io/v1/companies/${company}/serviceinvoices/${idProvedor}`
      : `https://api.enotasgw.com.br/v1/empresas/${company}/nfes/${idProvedor}`;
  const r = await fetch(url, { headers: { Authorization: `Basic ${token}`, Accept: "application/json" }, cache: "no-store" });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: d?.message || d?.mensagem || `${p} ${r.status}` };
  if (p === "nfeio") {
    return { ok: true, idProvedor, numero: d.number ? String(d.number) : undefined, chave: d.checkCode, url: d.pdf?.url, status: d.flowStatus };
  }
  return { ok: true, idProvedor, numero: d.numero ? String(d.numero) : undefined, chave: d.codigoVerificacao, url: d.linkDownloadPDF, status: d.status };
}
