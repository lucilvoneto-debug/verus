/**
 * Rotinas de pós-venda rodadas pelo cron diário (/api/cron/notifications):
 *
 *  - processarManutencoes(): plano de manutenção vencendo em 30 dias avisa a
 *    equipe (Notificacao) e o cliente (WhatsApp), uma vez por ciclo.
 *  - processarGatilhosClima(): choveu acima do limiar na cidade → manda
 *    mensagem para a carteira de clientes daquela cidade (respeitando cooldown)
 *    e registra cada envio em DisparoTemporal.
 */

import { prisma } from "./prisma";
import { sendMessage } from "./integrations/whatsapp";

const DIA_MS = 24 * 60 * 60 * 1000;

function addDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMeses(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function fmtBR(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function aplicarTemplate(msg: string, vars: Record<string, string>): string {
  return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

// ─── Manutenção preventiva ────────────────────────────────────────────────────

export const MSG_MANUTENCAO_PADRAO =
  "Olá {nome}! Aqui é da Verus Impermeabilização. A manutenção preventiva da sua obra {obra} está prevista para {data}. " +
  "Quer agendar? É só responder esta mensagem. 👷";

export type ResultadoManutencao = { avisados: number; notificacoes: number; erros: string[] };

export async function processarManutencoes(janelaDias = 30): Promise<ResultadoManutencao> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = addDias(hoje, janelaDias);

  const planos = await prisma.planoManutencao.findMany({
    where: {
      status: "ATIVO",
      proximaData: { lte: limite },
      OR: [{ ultimoAvisoEm: null }, { ultimoAvisoEm: { lt: addDias(hoje, -janelaDias) } }],
    },
    include: {
      cliente: { select: { id: true, nome: true, whatsapp: true, telefone: true } },
      obra: { select: { id: true, numero: true, nome: true } },
    },
    take: 200,
  });

  const gestores = await prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "GESTOR", "COMERCIAL", "SUPERVISOR"] } },
    select: { id: true },
  });
  const template = (await prisma.configuracao.findUnique({ where: { chave: "MSG_MANUTENCAO" } }))?.valor || MSG_MANUTENCAO_PADRAO;

  const out: ResultadoManutencao = { avisados: 0, notificacoes: 0, erros: [] };

  for (const p of planos) {
    const atrasado = p.proximaData < hoje;
    const titulo = atrasado ? "Manutenção atrasada" : "Manutenção vencendo";
    const mensagem = `${p.cliente.nome} — obra ${p.obra.numero} (${p.obra.nome}): manutenção ${atrasado ? "venceu" : "vence"} em ${fmtBR(p.proximaData)}.`;

    for (const g of gestores) {
      const dup = await prisma.notificacao.findFirst({
        where: { userId: g.id, tipo: "MANUTENCAO", link: `/dashboard/manutencao?plano=${p.id}`, createdAt: { gte: new Date(Date.now() - DIA_MS) } },
        select: { id: true },
      });
      if (dup) continue;
      await prisma.notificacao.create({
        data: { userId: g.id, tipo: "MANUTENCAO", titulo, mensagem, link: `/dashboard/manutencao?plano=${p.id}` },
      });
      out.notificacoes++;
    }

    const tel = p.cliente.whatsapp || p.cliente.telefone;
    if (tel) {
      const texto = aplicarTemplate(template, {
        nome: primeiroNome(p.cliente.nome),
        obra: `${p.obra.numero} · ${p.obra.nome}`,
        data: fmtBR(p.proximaData),
      });
      const r = await sendMessage(tel, texto);
      if (r.ok) out.avisados++;
      else out.erros.push(`${p.cliente.nome}: ${r.error ?? "falha"}`);
    }

    await prisma.planoManutencao.update({ where: { id: p.id }, data: { ultimoAvisoEm: new Date() } });
  }
  return out;
}

// ─── Gatilho de chuva ─────────────────────────────────────────────────────────

const OPEN_METEO = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com";

/** Chuva (mm) de ontem e de hoje (previsão) num ponto. */
export async function chuvaRecente(lat: number, lng: number): Promise<{ ontem: number; hoje: number }> {
  const url = new URL("/v1/forecast", OPEN_METEO);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "1");
  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  const j = (await r.json()) as { daily?: { precipitation_sum?: number[] } };
  const s = j.daily?.precipitation_sum ?? [];
  return { ontem: s[0] ?? 0, hoje: s[1] ?? 0 };
}

export type ResultadoClima = {
  gatilhos: Array<{ id: string; cidade: string; chuvaMm: number; disparou: boolean; enviados: number; falhas: number; motivo?: string }>;
};

export async function processarGatilhosClima(opts: { forcar?: boolean; gatilhoId?: string } = {}): Promise<ResultadoClima> {
  const gatilhos = await prisma.gatilhoTemporal.findMany({
    where: { ativo: true, ...(opts.gatilhoId ? { id: opts.gatilhoId } : {}) },
  });
  const out: ResultadoClima = { gatilhos: [] };

  for (const g of gatilhos) {
    let chuva = { ontem: 0, hoje: 0 };
    try {
      chuva = await chuvaRecente(g.lat, g.lng);
    } catch (e) {
      out.gatilhos.push({ id: g.id, cidade: g.cidade, chuvaMm: 0, disparou: false, enviados: 0, falhas: 0, motivo: e instanceof Error ? e.message : "erro clima" });
      continue;
    }
    const chuvaMm = Math.max(chuva.ontem, chuva.hoje);

    const emCooldown = g.ultimoDisparoEm ? Date.now() - g.ultimoDisparoEm.getTime() < g.cooldownDias * DIA_MS : false;
    if (!opts.forcar && (chuvaMm < g.limiarChuvaMm || emCooldown)) {
      out.gatilhos.push({
        id: g.id, cidade: g.cidade, chuvaMm, disparou: false, enviados: 0, falhas: 0,
        motivo: emCooldown ? `cooldown até ${fmtBR(addDias(g.ultimoDisparoEm!, g.cooldownDias))}` : `chuva ${chuvaMm.toFixed(1)} mm < limiar ${g.limiarChuvaMm} mm`,
      });
      continue;
    }

    // Carteira da cidade: quem já é cliente (tem obra ou garantia) e tem telefone.
    const clientes = await prisma.cliente.findMany({
      where: {
        cidade: { equals: g.cidade, mode: "insensitive" },
        OR: [{ whatsapp: { not: null } }, { telefone: { not: null } }],
      },
      select: { id: true, nome: true, whatsapp: true, telefone: true },
      take: 300,
    });

    // Não repete para quem já recebeu deste gatilho dentro do cooldown.
    const recentes = await prisma.disparoTemporal.findMany({
      where: { gatilhoId: g.id, createdAt: { gte: addDias(new Date(), -g.cooldownDias) } },
      select: { clienteId: true },
    });
    const jaRecebeu = new Set(recentes.map((r) => r.clienteId));

    let enviados = 0;
    let falhas = 0;
    for (const c of clientes) {
      if (jaRecebeu.has(c.id)) continue;
      const tel = c.whatsapp || c.telefone;
      if (!tel) continue;
      const texto = aplicarTemplate(g.mensagem, { nome: primeiroNome(c.nome), cidade: g.cidade, chuva: chuvaMm.toFixed(0) });
      const r = await sendMessage(tel, texto);
      await prisma.disparoTemporal.create({
        data: { clienteId: c.id, gatilhoId: g.id, chuvaMm, mensagem: texto, status: r.ok ? "ENVIADO" : "FALHOU" },
      });
      if (r.ok) enviados++;
      else falhas++;
    }

    await prisma.gatilhoTemporal.update({ where: { id: g.id }, data: { ultimoDisparoEm: new Date() } });
    out.gatilhos.push({ id: g.id, cidade: g.cidade, chuvaMm, disparou: true, enviados, falhas });
  }
  return out;
}
