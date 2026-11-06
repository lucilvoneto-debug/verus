import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco de mentira em memória: só o que lib/avaliacao-google.ts usa.
const db = vi.hoisted(() => {
  type Linha = Record<string, any>;
  const estado = {
    config: new Map<string, string>(),
    obras: [] as Linha[],
    pedidos: [] as Linha[],
    conversas: [] as Linha[],
    mensagens: [] as Linha[],
  };
  const aplicar = (row: Linha, data: Linha) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && "increment" in v) row[k] = (row[k] ?? 0) + v.increment;
      else row[k] = v;
    }
    return row;
  };
  const achar = (obraId: string) => estado.pedidos.find((p) => p.obraId === obraId);
  const unico = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
  const prisma = {
    configuracao: {
      findMany: async ({ where }: any) =>
        Array.from(estado.config.entries())
          .filter(([chave]) => chave.startsWith(where.chave.startsWith))
          .map(([chave, valor]) => ({ chave, valor })),
    },
    linhaWhatsapp: { findFirst: async () => null },
    obra: {
      findMany: async ({ where }: any) =>
        estado.obras.filter((o) => o.status === where.status && o.dataConclusao && o.dataConclusao >= where.dataConclusao.gte),
    },
    pedidoAvaliacao: {
      findMany: async ({ where }: any) => estado.pedidos.filter((p) => where.obraId.in.includes(p.obraId)),
      create: async ({ data }: any) => {
        if (achar(data.obraId)) throw unico();
        const row = aplicar({ tentativas: 0 }, data);
        estado.pedidos.push(row);
        return row;
      },
      update: async ({ where, data }: any) => aplicar(achar(where.obraId)!, data),
      upsert: async ({ where, create, update }: any) => {
        const atual = achar(where.obraId);
        if (atual) return aplicar(atual, update);
        const row = aplicar({ tentativas: 0 }, create);
        estado.pedidos.push(row);
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        const p = achar(where.obraId);
        if (!p || p.status !== where.status || !(p.tentativas < where.tentativas.lt)) return { count: 0 };
        aplicar(p, data);
        return { count: 1 };
      },
      delete: async ({ where }: any) => {
        estado.pedidos = estado.pedidos.filter((p) => p.obraId !== where.obraId);
      },
    },
    conversaWA: {
      findFirst: async ({ where }: any) => estado.conversas.find((c) => where.telefone.in.includes(c.telefone)) ?? null,
      create: async ({ data }: any) => {
        const row = { id: `conv${estado.conversas.length + 1}`, ...data };
        estado.conversas.push(row);
        return row;
      },
      update: async ({ where, data }: any) => aplicar(estado.conversas.find((c) => c.id === where.id)!, data),
    },
    mensagemWA: {
      create: async ({ data }: any) => {
        estado.mensagens.push(data);
        return data;
      },
    },
  };
  return { estado, prisma };
});

vi.mock("@/lib/prisma", () => ({ prisma: db.prisma }));

const meta = vi.hoisted(() => ({
  enviarTemplate: vi.fn(),
  linhaPadrao: vi.fn(),
  listarTemplates: vi.fn(),
}));
vi.mock("@/lib/whatsapp/meta", async (original) => ({
  ...(await original<typeof import("@/lib/whatsapp/meta")>()),
  ...meta,
}));

import { CHAVES, LINK_PADRAO, MAX_POR_RODADA, processarPedidosAvaliacao, saudacao } from "@/lib/avaliacao-google";

const AGORA = new Date("2026-11-05T15:00:00Z");
const diasAtras = (n: number) => new Date(AGORA.getTime() - n * 86_400_000);

function obra(n: number, extra: Record<string, any> = {}) {
  return {
    id: `obra${n}`,
    numero: `OB-2026-${String(n).padStart(3, "0")}`,
    nome: `Laje ${n}`,
    clienteId: `cli${n}`,
    status: "FINALIZADA",
    dataConclusao: diasAtras(5),
    cliente: {
      nome: "MARIA DA SILVA",
      tipo: "PF",
      categoria: "RESIDENCIAL",
      telefone: null,
      whatsapp: `(82) 99${String(n).padStart(3, "0")}-0000`,
    },
    ...extra,
  };
}

function ligar() {
  db.estado.config.set(CHAVES.ativo, "true");
  db.estado.config.set(CHAVES.modelo, "pedido_avaliacao_google");
}

beforeEach(() => {
  db.estado.config.clear();
  db.estado.obras = [];
  db.estado.pedidos = [];
  db.estado.conversas = [];
  db.estado.mensagens = [];
  meta.enviarTemplate.mockReset().mockResolvedValue({ ok: true, waId: "wamid.teste" });
  meta.linhaPadrao.mockReset().mockResolvedValue({ id: "linha1", phoneNumberId: "pn1", wabaId: null });
  meta.listarTemplates.mockReset().mockResolvedValue([]);
});

describe("pedido de avaliação no Google", () => {
  it("desligado não envia nem carimba", async () => {
    db.estado.config.set(CHAVES.modelo, "pedido_avaliacao_google"); // tudo pronto, menos o liga/desliga
    db.estado.obras = [obra(1)];
    const r = await processarPedidosAvaliacao({ agora: AGORA });
    expect(r.ligado).toBe(false);
    expect(r.enviados).toBe(0);
    expect(meta.enviarTemplate).not.toHaveBeenCalled();
    expect(db.estado.pedidos).toHaveLength(0);
  });

  it("dry devolve quem receberia e a mensagem, sem enviar e sem carimbar", async () => {
    ligar();
    db.estado.obras = [obra(1), obra(2, { status: "CANCELADA" }), obra(3, { dataConclusao: diasAtras(45) })];
    const r = await processarPedidosAvaliacao({ dry: true, agora: AGORA });
    expect(meta.enviarTemplate).not.toHaveBeenCalled();
    expect(db.estado.pedidos).toHaveLength(0);
    expect(r.envios).toHaveLength(1); // cancelada e fora dos 30 dias ficam de fora
    expect(r.envios[0].telefone).toBe("5582990010000");
    expect(r.envios[0].mensagem).toBe(
      "Olá, Maria! Aqui é da Verus Impermeabilizações. Obrigado por confiar na gente na obra Laje 1. " +
        `Se puder, deixe sua avaliação no Google, leva 1 minuto: ${LINK_PADRAO}\n\nUm abraço, equipe Verus.`,
    );
  });

  it("dry funciona desligado, para conferir antes de ligar", async () => {
    db.estado.obras = [obra(1)];
    const r = await processarPedidosAvaliacao({ dry: true, agora: AGORA });
    expect(r.envios).toHaveLength(1);
    expect(r.motivos.join(" ")).toMatch(/desligado/);
    expect(meta.enviarTemplate).not.toHaveBeenCalled();
  });

  it("não repete obra já pedida", async () => {
    ligar();
    db.estado.obras = [obra(1), obra(2)];
    db.estado.pedidos = [{ obraId: "obra1", status: "ENVIADO", tentativas: 1 }];

    const r1 = await processarPedidosAvaliacao({ agora: AGORA });
    expect(r1.enviados).toBe(1);
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(1);
    expect(meta.enviarTemplate.mock.calls[0][1]).toBe("5582990020000");

    const r2 = await processarPedidosAvaliacao({ agora: AGORA });
    expect(r2.enviados).toBe(0);
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(1);
    expect(r2.pulados.map((p) => p.motivo)).toEqual(["já pedido para esta obra", "já pedido para esta obra"]);
  });

  it("manda no máximo 10 por rodada; o resto vai na próxima", async () => {
    ligar();
    db.estado.obras = Array.from({ length: 15 }, (_, i) => obra(i + 1));

    const r1 = await processarPedidosAvaliacao({ agora: AGORA });
    expect(MAX_POR_RODADA).toBe(10);
    expect(r1.enviados).toBe(10);
    expect(r1.restam).toBe(5);
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(10);
    expect(db.estado.pedidos.filter((p) => p.status === "ENVIADO")).toHaveLength(10);

    const r2 = await processarPedidosAvaliacao({ agora: AGORA });
    expect(r2.enviados).toBe(5);
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(15);
  });

  it("sem modelo da Meta configurado não envia e diz o motivo", async () => {
    db.estado.config.set(CHAVES.ativo, "true");
    db.estado.obras = [obra(1)];
    const r = await processarPedidosAvaliacao({ agora: AGORA });
    expect(meta.enviarTemplate).not.toHaveBeenCalled();
    expect(db.estado.pedidos).toHaveLength(0);
    expect(r.motivos.join(" ")).toMatch(/modelo da Meta não configurado/);
  });

  it("pula cliente sem telefone e grava o envio na conversa do ERP", async () => {
    ligar();
    db.estado.obras = [obra(1), obra(2, { cliente: { nome: "João", tipo: "PF", categoria: "RESIDENCIAL", telefone: null, whatsapp: null } })];
    const r = await processarPedidosAvaliacao({ agora: AGORA });
    expect(r.enviados).toBe(1);
    expect(r.pulados).toEqual([{ obra: "OB-2026-002 (Laje 2)", motivo: "cliente sem telefone" }]);
    expect(db.estado.mensagens).toHaveLength(1);
    expect(db.estado.mensagens[0]).toMatchObject({ tipo: "TEMPLATE", enviada: true, waId: "wamid.teste" });
  });

  it("erro da conta (modelo inexistente) para a rodada sem gastar tentativa da obra", async () => {
    ligar();
    db.estado.obras = [obra(1), obra(2)];
    meta.enviarTemplate.mockResolvedValue({ ok: false, error: "132001 (#132001) Template name does not exist in the translation" });
    const r = await processarPedidosAvaliacao({ agora: AGORA });
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(1);
    expect(r.falhas).toBe(1);
    expect(db.estado.pedidos).toHaveLength(0); // volta para a fila
  });

  it("duas obras do mesmo telefone: uma mensagem, as duas carimbadas", async () => {
    ligar();
    const o2 = obra(2);
    o2.cliente.whatsapp = obra(1).cliente.whatsapp;
    db.estado.obras = [obra(1), o2];
    const r = await processarPedidosAvaliacao({ agora: AGORA });
    expect(meta.enviarTemplate).toHaveBeenCalledTimes(1);
    expect(r.enviados).toBe(1);
    expect(db.estado.pedidos.map((p) => p.status)).toEqual(["ENVIADO", "ENVIADO"]);
  });
});

describe("saudacao", () => {
  it("pessoa recebe o primeiro nome; empresa e condomínio recebem 'tudo bem'", () => {
    expect(saudacao({ nome: "JOSÉ CARLOS", tipo: "PF", categoria: "RESIDENCIAL" })).toBe("José");
    expect(saudacao({ nome: "Construtora X", tipo: "PJ", categoria: "CONSTRUTORA" })).toBe("tudo bem");
    expect(saudacao({ nome: "Ana", tipo: "PF", categoria: "CONDOMINIO" })).toBe("tudo bem");
    expect(saudacao({ nome: "Condomínio Ed. Mar Azul", tipo: "PF", categoria: "RESIDENCIAL" })).toBe("tudo bem");
  });
});
