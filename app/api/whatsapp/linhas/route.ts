/**
 * GET  → linhas do banco + situação real na Meta (status, webhook inscrito).
 * POST → cria/atualiza rótulo, responsável, padrão, ativo.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CFG_KEYS, graphGet, inscreverWebhookWaba, lerConfig, metaToken, normalizarTelefoneBR } from "@/lib/whatsapp/meta";

const META_BUSINESS_ID_ENV = process.env.META_BUSINESS_ID;

type FoneMeta = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  platform_type?: string;
  quality_rating?: string;
  wabaId: string;
  wabaNome: string;
  webhookOk: boolean;
};

export async function GET() {
  const linhas = await prisma.linhaWhatsapp.findMany({
    orderBy: [{ padrao: "desc" }, { createdAt: "asc" }],
    include: { responsavel: { select: { id: true, name: true } } },
  });

  const avisos: string[] = [];
  const fones: FoneMeta[] = [];
  const token = await metaToken();
  const configurado = !!token && !!process.env.META_APP_ID;

  if (!token) {
    avisos.push("Token da Meta ausente — conecte um número pela coexistência ou defina META_ACCESS_TOKEN.");
  } else {
    const wabas = new Map<string, string>();
    const wabaCfg = await lerConfig(CFG_KEYS.wabaId);
    if (wabaCfg) wabas.set(wabaCfg, "WABA conectada");
    for (const l of linhas) if (l.wabaId) wabas.set(l.wabaId, wabas.get(l.wabaId) ?? "WABA");
    const businessId = META_BUSINESS_ID_ENV || (await lerConfig(CFG_KEYS.businessId));
    if (businessId) {
      for (const edge of ["owned_whatsapp_business_accounts", "client_whatsapp_business_accounts"]) {
        try {
          const d = await graphGet<{ data?: { id: string; name?: string }[] }>(`${businessId}/${edge}?fields=id,name&limit=50`);
          for (const w of d?.data ?? []) wabas.set(String(w.id), w.name || "WABA");
        } catch { /* token do ES não enxerga o portfólio inteiro — normal */ }
      }
    }
    for (const [wid, wnome] of wabas) {
      const webhookOk = await inscreverWebhookWaba(wid);
      try {
        const d = await graphGet<{ data?: any[] }>(
          `${wid}/phone_numbers?fields=id,display_phone_number,verified_name,status,platform_type,quality_rating&limit=50`,
        );
        for (const p of d?.data ?? []) fones.push({ ...p, id: String(p.id), wabaId: wid, wabaNome: wnome, webhookOk });
      } catch (e) {
        avisos.push(`WABA ${wnome}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  const porId = new Map(fones.map((f) => [f.id, f]));
  const merged = [];
  for (const l of linhas) {
    const meta = porId.get(l.phoneNumberId) ?? null;
    if (meta) {
      porId.delete(meta.id);
      const patch: Record<string, unknown> = {};
      if (!l.numeroExibicao && meta.display_phone_number) patch.numeroExibicao = normalizarTelefoneBR(meta.display_phone_number);
      if (!l.nomeVerificado && meta.verified_name) patch.nomeVerificado = meta.verified_name;
      if (!l.wabaId) patch.wabaId = meta.wabaId;
      if (Object.keys(patch).length) await prisma.linhaWhatsapp.update({ where: { id: l.id }, data: patch }).catch(() => null);
    }
    merged.push({ ...l, meta });
  }

  return NextResponse.json({ configurado, linhas: merged, soNaMeta: Array.from(porId.values()), avisos });
}

const schema = z.object({
  phoneNumberId: z.string().min(3),
  wabaId: z.string().optional(),
  rotulo: z.string().max(60).optional(),
  numeroExibicao: z.string().optional(),
  responsavelId: z.string().nullable().optional(),
  padrao: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (d.padrao) await prisma.linhaWhatsapp.updateMany({ where: { padrao: true }, data: { padrao: false } });
  const linha = await prisma.linhaWhatsapp.upsert({
    where: { phoneNumberId: d.phoneNumberId },
    create: {
      phoneNumberId: d.phoneNumberId,
      wabaId: d.wabaId ?? null,
      rotulo: d.rotulo ?? null,
      numeroExibicao: d.numeroExibicao ? normalizarTelefoneBR(d.numeroExibicao) : null,
      responsavelId: d.responsavelId ?? null,
      padrao: d.padrao ?? false,
      ativo: d.ativo ?? true,
    },
    update: {
      ...(d.wabaId !== undefined ? { wabaId: d.wabaId } : {}),
      ...(d.rotulo !== undefined ? { rotulo: d.rotulo || null } : {}),
      ...(d.responsavelId !== undefined ? { responsavelId: d.responsavelId } : {}),
      ...(d.padrao !== undefined ? { padrao: d.padrao } : {}),
      ...(d.ativo !== undefined ? { ativo: d.ativo } : {}),
    },
  });
  return NextResponse.json(linha);
}
