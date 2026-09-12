/**
 * CRM — criação e atribuição de leads.
 *
 * Todo lead entra por aqui, venha do formulário do site, do WhatsApp
 * (coexistência), de Lead Ads da Meta, do Google (perfil da empresa / Ads) ou
 * de cadastro manual. Deduplica por telefone (lead aberto nos últimos 30 dias)
 * e avisa a equipe comercial.
 */
import { prisma } from "@/lib/prisma";
import { normalizarTelefoneBR, variantesTelefoneBR } from "@/lib/whatsapp/meta";

export const ETAPAS = [
  { value: "NOVO", label: "Novo", tone: "blue" },
  { value: "CONTATO", label: "Em contato", tone: "yellow" },
  { value: "VISITA_AGENDADA", label: "Visita agendada", tone: "yellow" },
  { value: "ORCAMENTO_ENVIADO", label: "Orçamento enviado", tone: "blue" },
  { value: "NEGOCIACAO", label: "Negociação", tone: "yellow" },
  { value: "GANHO", label: "Ganho", tone: "green" },
  { value: "PERDIDO", label: "Perdido", tone: "red" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["value"];
export const ETAPAS_ABERTAS: Etapa[] = ["NOVO", "CONTATO", "VISITA_AGENDADA", "ORCAMENTO_ENVIADO", "NEGOCIACAO"];

export const ORIGENS: Record<string, string> = {
  SITE: "Site",
  WHATSAPP: "WhatsApp",
  GOOGLE_GBP: "Google (perfil)",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  INSTAGRAM: "Instagram",
  INDICACAO: "Indicação",
  MANUAL: "Manual",
};

export const MOTIVOS_PERDA = ["PRECO", "PRAZO", "CONCORRENTE", "SEM_RESPOSTA", "DESISTIU", "FORA_DA_AREA", "OUTRO"] as const;

export type NovoLeadInput = {
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  tipoImovel?: string | null;
  origem: string;
  descricao: string;
  urgencia?: string;
  responsavelId?: string | null;
  conversaId?: string | null;
  valorEstimado?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  ctwaClid?: string | null;
  adId?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  /** Quem criou (cadastro manual). */
  userId?: string | null;
};

const JANELA_DEDUP_MS = 30 * 24 * 60 * 60 * 1000;

/** Lead aberto recente com o mesmo telefone (evita duplicar quem mandou 2 mensagens). */
export async function acharLeadAbertoPorTelefone(telefone: string | null | undefined) {
  const tel = normalizarTelefoneBR(telefone);
  if (!tel) return null;
  return prisma.lead.findFirst({
    where: {
      telefone: { in: variantesTelefoneBR(tel) },
      status: { in: ETAPAS_ABERTAS },
      createdAt: { gte: new Date(Date.now() - JANELA_DEDUP_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function criarLead(input: NovoLeadInput) {
  const telefone = normalizarTelefoneBR(input.telefone) || null;

  const existente = await acharLeadAbertoPorTelefone(telefone);
  if (existente) {
    await prisma.leadEvento.create({
      data: {
        leadId: existente.id,
        tipo: "SISTEMA",
        descricao: `Novo contato pela origem ${ORIGENS[input.origem] ?? input.origem}: ${input.descricao}`.slice(0, 1000),
      },
    });
    // Enriquecimento: preenche o que estava vazio (nome, e-mail, rastreio).
    const patch: Record<string, unknown> = {};
    if (!existente.nome && input.nome) patch.nome = input.nome;
    if (!existente.email && input.email) patch.email = input.email;
    if (!existente.conversaId && input.conversaId) patch.conversaId = input.conversaId;
    if (!existente.gclid && input.gclid) patch.gclid = input.gclid;
    if (!existente.ctwaClid && input.ctwaClid) patch.ctwaClid = input.ctwaClid;
    if (Object.keys(patch).length) {
      await prisma.lead.update({ where: { id: existente.id }, data: patch });
    }
    return { lead: existente, duplicado: true as const };
  }

  // Cliente já cadastrado com esse telefone? Vincula.
  let clienteId: string | null = null;
  if (telefone) {
    const vars = variantesTelefoneBR(telefone);
    const semDdi = vars.map((v) => v.replace(/^55/, ""));
    const cli = await prisma.cliente.findFirst({
      where: {
        OR: [
          ...vars.map((v) => ({ whatsapp: { contains: v.slice(-8) } })),
          ...semDdi.map((v) => ({ telefone: { contains: v.slice(-8) } })),
        ],
      },
      select: { id: true, nome: true },
    });
    if (cli) clienteId = cli.id;
  }

  const lead = await prisma.lead.create({
    data: {
      nome: input.nome?.trim() || null,
      telefone,
      email: input.email?.trim().toLowerCase() || null,
      cidade: input.cidade || null,
      bairro: input.bairro || null,
      tipoImovel: input.tipoImovel || null,
      origem: input.origem,
      descricao: input.descricao.slice(0, 2000),
      urgencia: input.urgencia ?? "MEDIA",
      status: "NOVO",
      statusEm: new Date(),
      responsavelId: input.responsavelId || null,
      clienteId,
      conversaId: input.conversaId || null,
      valorEstimado: input.valorEstimado ?? null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmTerm: input.utmTerm || null,
      utmContent: input.utmContent || null,
      gclid: input.gclid || null,
      fbclid: input.fbclid || null,
      fbc: input.fbc || null,
      fbp: input.fbp || null,
      ctwaClid: input.ctwaClid || null,
      adId: input.adId || null,
      landingPage: input.landingPage?.slice(0, 500) || null,
      referrer: input.referrer?.slice(0, 500) || null,
      eventos: {
        create: {
          tipo: "SISTEMA",
          descricao: `Lead criado via ${ORIGENS[input.origem] ?? input.origem}`,
          userId: input.userId || null,
        },
      },
    },
  });

  await notificarNovoLead(lead.id, lead.nome ?? telefone ?? "sem nome", input.origem).catch(() => null);
  return { lead, duplicado: false as const };
}

export async function mudarEtapa(
  leadId: string,
  status: Etapa,
  opts: { userId?: string | null; motivoPerda?: string | null; valorFechado?: number | null } = {},
) {
  const atual = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (!atual) return null;
  if (atual.status === status) return prisma.lead.findUnique({ where: { id: leadId } });
  const de = ETAPAS.find((e) => e.value === atual.status)?.label ?? atual.status;
  const para = ETAPAS.find((e) => e.value === status)?.label ?? status;
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      statusEm: new Date(),
      ...(status === "PERDIDO" ? { motivoPerda: opts.motivoPerda ?? null } : {}),
      ...(status === "GANHO" && opts.valorFechado != null ? { valorFechado: opts.valorFechado } : {}),
      eventos: {
        create: {
          tipo: "ETAPA",
          descricao: `${de} → ${para}${status === "PERDIDO" && opts.motivoPerda ? ` (${opts.motivoPerda})` : ""}`,
          userId: opts.userId ?? null,
        },
      },
    },
  });
}

async function notificarNovoLead(leadId: string, quem: string, origem: string) {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "COMERCIAL", "GESTOR"] } },
    select: { id: true },
  });
  if (!users.length) return;
  await prisma.notificacao.createMany({
    data: users.map((u) => ({
      userId: u.id,
      tipo: "LEAD_NOVO",
      titulo: "Novo lead",
      mensagem: `${quem} · ${ORIGENS[origem] ?? origem}`,
      link: `/dashboard/crm/${leadId}`,
    })),
  });
}

// ─── Atribuição pela primeira mensagem do WhatsApp ──────────────────────────

export type Atribuicao = {
  origem: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  ctwaClid?: string | null;
  adId?: string | null;
};

/**
 * Descobre de onde veio quem mandou a primeira mensagem.
 *  - Meta click-to-WhatsApp: `referral` (ctwa_clid, source_id = anúncio)
 *  - Google Perfil da Empresa: texto pré-preenchido "vim pelo Google"
 *  - Landing/anúncio: tag "(ref: fonte/campanha)" no texto do wa.me
 */
export function atribuirPorMensagem(texto: string, referral?: any): Atribuicao {
  if (referral?.ctwa_clid || referral?.source_type === "ad") {
    return {
      origem: "META_ADS",
      utmSource: "meta",
      utmMedium: "ctwa",
      utmCampaign: referral?.headline ?? null,
      utmContent: referral?.source_id ?? null,
      ctwaClid: referral?.ctwa_clid ?? null,
      adId: referral?.source_id ?? null,
    };
  }
  const t = (texto || "").toLowerCase();
  const ref = /\(ref:\s*([^)]+)\)/i.exec(texto || "");
  if (ref) {
    const [src, camp] = ref[1].split("/").map((s) => s.trim());
    const origem =
      src === "google-ads" || src === "gads" ? "GOOGLE_ADS"
      : src === "gbp" || src === "google" ? "GOOGLE_GBP"
      : src === "meta" || src === "facebook" || src === "instagram" ? "META_ADS"
      : "SITE";
    return { origem, utmSource: src, utmCampaign: camp ?? null };
  }
  if (t.includes("vim pelo google")) return { origem: "GOOGLE_GBP", utmSource: "google", utmMedium: "gbp" };
  if (t.includes("vim pelo instagram")) return { origem: "INSTAGRAM", utmSource: "instagram" };
  if (t.includes("vim pelo site")) return { origem: "SITE", utmSource: "site" };
  return { origem: "WHATSAPP" };
}
