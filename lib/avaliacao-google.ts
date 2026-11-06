/**
 * Pedido de avaliação no Google por WhatsApp quando a obra termina (05/11/2026).
 *
 * Rodado por /api/cron/avaliacao-google. Candidata = obra FINALIZADA com
 * dataConclusao nos últimos 30 dias e ainda sem pedido. Cada rodada manda no
 * máximo 10 e grava uma linha em PedidoAvaliacao por obra, que é o carimbo que
 * impede pedir duas vezes.
 *
 * Nasce DESLIGADO. Só envia com as três coisas no lugar:
 *   1. Configuracao "avaliacao_google.ativo" = "true" (ausente = desligado);
 *   2. Configuracao "avaliacao_google.modelo" = nome do modelo APROVADO na Meta.
 *      O envio é pela Cloud API oficial; fora da janela de 24 h só modelo
 *      aprovado passa. Sem modelo configurado não envia e diz o motivo;
 *   3. um número de WhatsApp conectado (Configurações → WhatsApp).
 * O link vem de "avaliacao_google.link" (padrão: perfil da Verus no Maps).
 *
 * Política do Google: nada de desconto ou brinde pela avaliação, e nada de
 * pedir só a quem "gostou". Aqui só se pula por motivo operacional: obra que
 * não está FINALIZADA (cancelada fica de fora pela própria consulta), cliente
 * sem telefone ou com telefone inválido, obra que já teve pedido.
 */

import { prisma } from "@/lib/prisma";
import {
  enviarTemplate,
  linhaPadrao,
  listarTemplates,
  normalizarTelefoneBR,
  renderizarTemplate,
  variantesTelefoneBR,
} from "@/lib/whatsapp/meta";

export const CHAVES = {
  ativo: "avaliacao_google.ativo",
  link: "avaliacao_google.link",
  modelo: "avaliacao_google.modelo",
  idioma: "avaliacao_google.idioma",
} as const;

/** Abre o perfil da Verus no Maps. O dono pode trocar pelo link oficial do painel do Google. */
export const LINK_PADRAO =
  "https://www.google.com/maps/place//data=!4m3!3m2!1s0x6dad6102562d5dbf:0x275b815d71872b74!12e1";

export const JANELA_DIAS = 30;
export const MAX_POR_RODADA = 10;
/** Falha por número (ex.: telefone que não tem WhatsApp) tenta de novo até 3 rodadas. */
export const MAX_TENTATIVAS = 3;

/**
 * Corpo do modelo a criar na Meta (categoria MARKETING, idioma pt_BR).
 * {{1}} = primeiro nome ou "tudo bem", {{2}} = obra, {{3}} = link.
 * A Meta recusa modelo que termina numa variável; por isso a despedida no fim.
 */
export const CORPO_MODELO =
  "Olá, {{1}}! Aqui é da Verus Impermeabilizações. Obrigado por confiar na gente na obra {{2}}. " +
  "Se puder, deixe sua avaliação no Google, leva 1 minuto: {{3}}\n\nUm abraço, equipe Verus.";

const DIA_MS = 24 * 60 * 60 * 1000;

export type ConfigAvaliacao = { ligado: boolean; link: string; modelo: string | null; idioma: string };

export async function lerConfigAvaliacao(): Promise<ConfigAvaliacao> {
  const rows = await prisma.configuracao.findMany({ where: { chave: { startsWith: "avaliacao_google." } } });
  const v = (k: string) => (rows.find((r) => r.chave === k)?.valor ?? "").trim();
  return {
    ligado: v(CHAVES.ativo).toLowerCase() === "true",
    link: v(CHAVES.link) || LINK_PADRAO,
    modelo: v(CHAVES.modelo) || null,
    idioma: v(CHAVES.idioma) || "pt_BR",
  };
}

// ─── Texto ──────────────────────────────────────────────────────────────────

const CATEGORIAS_EMPRESA = new Set(["CONDOMINIO", "CONSTRUTORA", "EMPRESA", "INDUSTRIA"]);
const NOME_DE_EMPRESA =
  /(condom[ií]nio|edif[ií]cio|residencial|ltda|eireli|s\/a|s\.a\.|construtora|incorporadora|associa[cç][aã]o|igreja)/i;

/**
 * O que vai no "Olá, {{1}}!". Empresa e condomínio não têm primeiro nome
 * ("Olá, CONDOMINIO!"), então recebem "Olá, tudo bem!". Pessoa recebe o
 * primeiro nome com só a inicial maiúscula ("JOSÉ" vira "José").
 */
export function saudacao(c: { nome: string | null; tipo: string | null; categoria: string | null }): string {
  const nome = String(c.nome ?? "").trim();
  if (c.tipo === "PJ" || CATEGORIAS_EMPRESA.has(String(c.categoria ?? ""))) return "tudo bem";
  if (NOME_DE_EMPRESA.test(nome)) return "tudo bem";
  const p = nome.split(/\s+/)[0] ?? "";
  if (p.length < 2) return "tudo bem";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/** A Meta recusa parâmetro com quebra de linha, tab ou 4+ espaços seguidos. */
function limparParametro(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Telefone que a Meta aceita: 55 + DDD + 8 ou 9 dígitos. */
function telefoneValido(t: string): boolean {
  return /^55\d{10,11}$/.test(t);
}

// ─── Erros ──────────────────────────────────────────────────────────────────

/**
 * Erro que não é do cliente, é da conta (token vencido, modelo inexistente ou
 * com variáveis erradas, conta bloqueada, limite de envio, rede). Nesse caso a
 * rodada para e a obra NÃO perde tentativa: senão um token vencido queimaria a
 * fila inteira em 3 dias.
 */
const CODIGOS_GLOBAIS = new Set([
  "10", "190", "200", "368", "130429", "131031", "131042",
  "132000", "132001", "132005", "132007", "132012", "132015", "132016",
]);
export function ehErroGlobal(erro: string): boolean {
  const codigo = /^(\d+)\s/.exec(erro.trim())?.[1];
  if (codigo && CODIGOS_GLOBAIS.has(codigo)) return true;
  return /Token da Meta ausente|does not exist|fetch failed|ECONN|ETIMEDOUT|Graph 5\d\d/i.test(erro);
}

// ─── Rodada ─────────────────────────────────────────────────────────────────

export type ItemAvaliacao = {
  obraId: string;
  obra: string;
  clienteId: string;
  cliente: string;
  telefone: string;
  mensagem: string;
  /** Outras obras do mesmo telefone nesta rodada: vão juntas, sem segunda mensagem. */
  junto: string[];
};

export type ResultadoAvaliacao = {
  ligado: boolean;
  dry: boolean;
  modelo: string | null;
  numeroConectado: boolean;
  link: string;
  /** Obras FINALIZADAS nos últimos 30 dias. */
  finalizadas: number;
  /** Dry: quem receberia nesta rodada. Real: quem recebeu. */
  envios: ItemAvaliacao[];
  /** Ficam para a próxima rodada (passou de 10). */
  restam: number;
  enviados: number;
  falhas: number;
  pulados: { obra: string; motivo: string }[];
  /** Por que não enviou (configuração, falhas). */
  motivos: string[];
};

type ObraCandidata = {
  id: string;
  numero: string;
  nome: string;
  clienteId: string;
  cliente: { nome: string; tipo: string; categoria: string; telefone: string | null; whatsapp: string | null };
};

export async function processarPedidosAvaliacao(
  opts: { dry?: boolean; agora?: Date } = {},
): Promise<ResultadoAvaliacao> {
  const dry = !!opts.dry;
  const agora = opts.agora ?? new Date();
  const cfg = await lerConfigAvaliacao();
  const linha = await linhaPadrao().catch(() => null);

  const out: ResultadoAvaliacao = {
    ligado: cfg.ligado,
    dry,
    modelo: cfg.modelo,
    numeroConectado: !!linha,
    link: cfg.link,
    finalizadas: 0,
    envios: [],
    restam: 0,
    enviados: 0,
    falhas: 0,
    pulados: [],
    motivos: [],
  };

  // Desligado: não lê fila nem envia. O dry continua funcionando para o dono
  // ver quem receberia antes de dizer SIM.
  if (!cfg.ligado && !dry) {
    out.motivos.push(`desligado (${CHAVES.ativo} não é "true")`);
    return out;
  }

  const desde = new Date(agora.getTime() - JANELA_DIAS * DIA_MS);
  const obras: ObraCandidata[] = await prisma.obra.findMany({
    where: { status: "FINALIZADA", dataConclusao: { gte: desde } },
    select: {
      id: true,
      numero: true,
      nome: true,
      clienteId: true,
      cliente: { select: { nome: true, tipo: true, categoria: true, telefone: true, whatsapp: true } },
    },
    // Mais antiga primeiro: é a que sai da janela de 30 dias antes.
    orderBy: { dataConclusao: "asc" },
    take: 200,
  });
  out.finalizadas = obras.length;
  if (!obras.length) return out;

  let pedidos: { obraId: string; status: string; tentativas: number }[];
  try {
    pedidos = await prisma.pedidoAvaliacao.findMany({
      where: { obraId: { in: obras.map((o) => o.id) } },
      select: { obraId: true, status: true, tentativas: true },
    });
  } catch (e: any) {
    if (e?.code === "P2021") {
      // Não usar "prisma db push" no banco de produção: em 05/11/2026 ele também
      // apagaria as 43 tabelas backup_* que existem lá fora do schema. Criar só
      // esta tabela com o CREATE TABLE do commit que a introduziu.
      throw new Error('A tabela "PedidoAvaliacao" ainda não existe no banco: falta criá-la (CREATE TABLE do commit, não prisma db push).');
    }
    throw e;
  }
  const pedidoDa = new Map(pedidos.map((p) => [p.obraId, p]));

  // Monta a fila desta rodada.
  const fila: ItemAvaliacao[] = [];
  const paramsDa = new Map<string, string[]>();
  const porTelefone = new Map<string, ItemAvaliacao>();
  for (const o of obras) {
    const rotulo = `${o.numero} (${o.nome})`;
    const p = pedidoDa.get(o.id);
    if (p) {
      if (p.status !== "FALHOU") {
        out.pulados.push({ obra: rotulo, motivo: "já pedido para esta obra" });
        continue;
      }
      if (p.tentativas >= MAX_TENTATIVAS) {
        out.pulados.push({ obra: rotulo, motivo: `falhou ${p.tentativas} vezes, desistiu` });
        continue;
      }
    }
    const bruto = o.cliente.whatsapp || o.cliente.telefone;
    if (!bruto?.trim()) {
      out.pulados.push({ obra: rotulo, motivo: "cliente sem telefone" });
      continue;
    }
    const telefone = normalizarTelefoneBR(bruto);
    if (!telefoneValido(telefone)) {
      out.pulados.push({ obra: rotulo, motivo: `telefone inválido (${bruto})` });
      continue;
    }
    // Cliente com duas obras terminando junto recebe UMA mensagem; a outra obra
    // é carimbada junto para não pedir de novo amanhã.
    const mesmo = variantesTelefoneBR(telefone).map((t) => porTelefone.get(t)).find(Boolean);
    if (mesmo) {
      mesmo.junto.push(o.id);
      out.pulados.push({ obra: rotulo, motivo: `mesmo telefone da obra ${mesmo.obra}: vai junto, sem segunda mensagem` });
      continue;
    }
    if (fila.length >= MAX_POR_RODADA) {
      out.restam++;
      continue;
    }
    const params = [saudacao(o.cliente), limparParametro(o.nome || o.numero), cfg.link];
    const item: ItemAvaliacao = {
      obraId: o.id,
      obra: o.numero,
      clienteId: o.clienteId,
      cliente: o.cliente.nome,
      telefone,
      mensagem: renderizarTemplate(CORPO_MODELO, params),
      junto: [],
    };
    fila.push(item);
    paramsDa.set(o.id, params);
    porTelefone.set(telefone, item);
  }

  if (!cfg.ligado) out.motivos.push(`desligado (${CHAVES.ativo} não é "true"): a rodada de verdade não envia`);
  if (!cfg.modelo) out.motivos.push(`modelo da Meta não configurado (${CHAVES.modelo}): nada é enviado`);
  if (!linha) out.motivos.push("nenhum número de WhatsApp conectado (Configurações → WhatsApp): nada é enviado");

  if (dry) {
    out.envios = fila;
    return out;
  }
  if (!cfg.modelo || !linha || !fila.length) {
    out.restam += fila.length;
    return out;
  }

  // Texto real do modelo na Meta, para o histórico da conversa ficar igual ao
  // que o cliente leu (mesmo cuidado da rota de template). Sem ele, usa o padrão.
  let corpoMeta: string | null = null;
  try {
    if (linha.wabaId) {
      corpoMeta = (await listarTemplates(linha.wabaId)).find((t) => t.name === cfg.modelo && t.language === cfg.idioma)?.body ?? null;
    }
  } catch {
    /* mantém o padrão */
  }

  for (let i = 0; i < fila.length; i++) {
    const item = fila[i];
    const params = paramsDa.get(item.obraId)!;
    if (corpoMeta) item.mensagem = renderizarTemplate(corpoMeta, params);

    const anterior = pedidoDa.get(item.obraId) ?? null;
    if (!(await reservar(item, anterior))) {
      out.pulados.push({ obra: item.obra, motivo: "outra rodada pegou esta obra" });
      continue;
    }

    const componentes = [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }];
    const r = await enviarTemplate(linha.phoneNumberId, item.telefone, cfg.modelo, cfg.idioma, componentes);

    if (r.ok) {
      out.enviados++;
      out.envios.push(item);
      await prisma.pedidoAvaliacao.update({
        where: { obraId: item.obraId },
        data: { status: "ENVIADO", waId: r.waId ?? null, enviadoEm: agora, erro: null, tentativas: { increment: 1 } },
      });
      for (const obraId of item.junto) {
        const junto = {
          status: "ENVIADO",
          waId: r.waId ?? null,
          enviadoEm: agora,
          erro: `pedido junto com a obra ${item.obra}`,
        };
        await prisma.pedidoAvaliacao
          .upsert({
            where: { obraId },
            create: { obraId, clienteId: item.clienteId, telefone: item.telefone, mensagem: item.mensagem, ...junto },
            update: junto,
          })
          .catch((e) => console.error("[avaliacao-google] carimbo junto falhou", obraId, e));
      }
      await registrarNaConversa(linha.id, item, r.waId ?? null, agora).catch((e) =>
        console.error("[avaliacao-google] histórico da conversa falhou", item.obra, e),
      );
      continue;
    }

    const erro = String(r.error ?? "falha sem motivo").slice(0, 300);
    out.falhas++;
    if (!out.motivos.includes(erro)) out.motivos.push(erro);

    if (ehErroGlobal(erro)) {
      // Problema da conta, não do cliente: devolve a obra para a fila sem gastar tentativa e para a rodada.
      if (anterior) {
        await prisma.pedidoAvaliacao.update({ where: { obraId: item.obraId }, data: { status: "FALHOU", erro } });
      } else {
        await prisma.pedidoAvaliacao.delete({ where: { obraId: item.obraId } });
      }
      out.restam += fila.length - i;
      out.motivos.push("rodada interrompida: erro da conta do WhatsApp, não do cliente");
      break;
    }
    await prisma.pedidoAvaliacao.update({
      where: { obraId: item.obraId },
      data: { status: "FALHOU", erro, tentativas: { increment: 1 } },
    });
  }

  return out;
}

/**
 * Trava a obra ANTES de enviar (status ENVIANDO). O obraId é único, então duas
 * rodadas ao mesmo tempo não mandam duas mensagens; e se o processo cair depois
 * do envio, a obra fica ENVIANDO e nunca é repetida.
 */
async function reservar(
  item: ItemAvaliacao,
  anterior: { status: string; tentativas: number } | null,
): Promise<boolean> {
  if (!anterior) {
    try {
      await prisma.pedidoAvaliacao.create({
        data: {
          obraId: item.obraId,
          clienteId: item.clienteId,
          telefone: item.telefone,
          mensagem: item.mensagem,
          status: "ENVIANDO",
        },
      });
      return true;
    } catch (e: any) {
      if (e?.code === "P2002") return false;
      throw e;
    }
  }
  const r = await prisma.pedidoAvaliacao.updateMany({
    where: { obraId: item.obraId, status: "FALHOU", tentativas: { lt: MAX_TENTATIVAS } },
    data: { status: "ENVIANDO", telefone: item.telefone, mensagem: item.mensagem },
  });
  return r.count === 1;
}

/** Grava o pedido na conversa do ERP, como a rota de template faz. */
async function registrarNaConversa(linhaId: string, item: ItemAvaliacao, waId: string | null, agora: Date) {
  const existente = await prisma.conversaWA.findFirst({
    where: { telefone: { in: variantesTelefoneBR(item.telefone) }, linhaId },
    orderBy: { ultimaMensagemEm: "desc" },
    select: { id: true },
  });
  const conversa =
    existente ??
    (await prisma.conversaWA.create({
      data: { telefone: item.telefone, linhaId, nome: item.cliente, clienteId: item.clienteId },
      select: { id: true },
    }));
  await prisma.mensagemWA.create({
    data: {
      conversaId: conversa.id,
      waId,
      texto: item.mensagem,
      tipo: "TEMPLATE",
      enviada: true,
      status: "sent",
      createdAt: agora,
    },
  });
  await prisma.conversaWA.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: item.mensagem.slice(0, 200), ultimaMensagemEm: agora },
  });
}
