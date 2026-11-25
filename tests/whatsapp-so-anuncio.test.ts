import { beforeEach, describe, expect, it, vi } from "vitest";

// Número que também é pessoal: o sistema só pode guardar conversa que chega por
// anúncio. Estes testes travam a regra no aviso da Meta de ponta a ponta, com um
// banco de mentira: conversa comum, resposta do celular e histórico antigo desse
// número nunca são gravados; os outros números continuam guardando tudo.

type Linha = { id: string; phoneNumberId: string; responsavelId: null };
type Conversa = { id: string; telefone: string; linhaId: string | null; leadId: string | null };
const db = { linhas: [] as Linha[], conversas: [] as Conversa[], mensagens: [] as any[], leads: [] as any[] };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    linhaWhatsapp: {
      findUnique: vi.fn(async ({ where }: any) => db.linhas.find((l) => l.phoneNumberId === where.phoneNumberId) ?? null),
      findMany: vi.fn(async () => db.linhas),
      count: vi.fn(async () => db.linhas.length),
      create: vi.fn(async ({ data }: any) => {
        const l = { id: `L${db.linhas.length + 1}`, responsavelId: null, ...data };
        db.linhas.push(l);
        return l;
      }),
    },
    conversaWA: {
      findFirst: vi.fn(async ({ where }: any) => {
        const c = db.conversas.find((x) => where.telefone.in.includes(x.telefone) && (!where.linhaId || x.linhaId === where.linhaId));
        return c ? { id: c.id, lead: c.leadId ? { id: c.leadId } : null } : null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const c = { id: `C${db.conversas.length + 1}`, leadId: null, ...data };
        db.conversas.push(c);
        return { id: c.id };
      }),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    mensagemWA: {
      upsert: vi.fn(async ({ where, create }: any) => {
        if (!db.mensagens.find((m) => m.waId === where.waId)) db.mensagens.push(create);
        return create;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    lead: { update: vi.fn(async () => ({})) },
    leadEvento: { create: vi.fn(async () => ({})) },
    configuracao: { findUnique: vi.fn(async () => null) },
  },
}));

vi.mock("@/lib/crm/leads", () => ({
  atribuirPorMensagem: (_texto: string, referral?: any) =>
    referral?.ctwa_clid || referral?.source_type === "ad" ? { origem: "META_ADS", adId: referral?.source_id ?? null } : { origem: "WHATSAPP" },
  criarLead: vi.fn(async (d: any) => {
    const lead = { id: `LD${db.leads.length + 1}`, ...d };
    db.leads.push(lead);
    const c = db.conversas.find((x) => x.id === d.conversaId);
    if (c) c.leadId = lead.id;
    return { lead };
  }),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/meta/route";
import { chaveTelefone, linhaSoAnuncio, numerosSoAnuncio, veioDeAnuncio } from "@/lib/whatsapp/so-anuncio";

const PESSOAL = "5582936180823"; // número que também é pessoal
const EMPRESA = "558291669449"; // número só da empresa
const CLIENTE = "5582988887777";
const AMIGO = "5582977776666";
const ANUNCIO = { source_type: "ad", source_id: "120251270861040484", headline: "Impermeabilização de obra", ctwa_clid: "clique-1" };

let seq = 0;
const mensagem = (de: string, texto: string, referral?: object) => ({
  id: `wamid.${++seq}`,
  from: de,
  timestamp: "1795600000",
  type: "text",
  text: { body: texto },
  ...(referral ? { referral } : {}),
});

async function aviso(numero: string, campo: string, valor: object) {
  const corpo = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ field: campo, value: { metadata: { phone_number_id: `PID-${numero}`, display_phone_number: numero }, ...valor } }] }],
  };
  const r = await POST(new NextRequest("https://verus.exemplo.com.br/api/webhooks/meta", { method: "POST", body: JSON.stringify(corpo) }));
  expect(r.status).toBe(200);
}

beforeEach(() => {
  db.linhas.length = 0;
  db.conversas.length = 0;
  db.mensagens.length = 0;
  db.leads.length = 0;
  delete process.env.META_APP_SECRET; // sem segredo o aviso de teste não precisa de assinatura
  process.env.WHATSAPP_SO_ANUNCIO_NUMEROS = "(82) 93618-0823";
});

describe("lista de números só-anúncio", () => {
  it("reconhece o mesmo número com ou sem 55 e com ou sem o 9", () => {
    for (const n of ["5582936180823", "558236180823", "82936180823", "8236180823", "+55 82 93618-0823", "(82) 3618-0823"]) {
      expect(linhaSoAnuncio(n), n).toBe(true);
    }
    expect(linhaSoAnuncio(EMPRESA)).toBe(false);
    expect(linhaSoAnuncio("")).toBe(false);
    expect(linhaSoAnuncio(null)).toBe(false);
  });

  it("lista vazia ou ausente não marca nenhum número", () => {
    expect(numerosSoAnuncio("").size).toBe(0);
    expect(linhaSoAnuncio(PESSOAL, "")).toBe(false);
    expect(linhaSoAnuncio(PESSOAL, undefined as unknown as string)).toBe(true); // usa a do servidor
    delete process.env.WHATSAPP_SO_ANUNCIO_NUMEROS;
    expect(linhaSoAnuncio(PESSOAL)).toBe(false);
  });

  it("aceita vários números e ignora lixo", () => {
    const s = numerosSoAnuncio("82 93618-0823, 5582999990000; abc, 123");
    expect(s.size).toBe(2);
    expect(s.has(chaveTelefone("82999990000"))).toBe(true);
  });

  it("só conta como anúncio quem traz a marca da Meta", () => {
    expect(veioDeAnuncio(ANUNCIO)).toBe(true);
    expect(veioDeAnuncio({ source_type: "post", source_id: "1" })).toBe(true);
    expect(veioDeAnuncio({ ctwa_clid: "x" })).toBe(true);
    expect(veioDeAnuncio(undefined)).toBe(false);
    expect(veioDeAnuncio(null)).toBe(false);
    expect(veioDeAnuncio({})).toBe(false);
    expect(veioDeAnuncio("anuncio")).toBe(false);
  });
});

describe("aviso da Meta em número que também é pessoal", () => {
  it("conversa comum não é guardada: nem conversa, nem mensagem, nem contato no funil", async () => {
    await aviso(PESSOAL, "messages", { contacts: [{ wa_id: AMIGO, profile: { name: "Amigo" } }], messages: [mensagem(AMIGO, "e aí, bora almoçar?")] });
    expect(db.conversas).toHaveLength(0);
    expect(db.mensagens).toHaveLength(0);
    expect(db.leads).toHaveLength(0);
  });

  it("conversa que chega por anúncio é guardada e vira contato com o anúncio de origem", async () => {
    await aviso(PESSOAL, "messages", { contacts: [{ wa_id: CLIENTE, profile: { name: "Cliente" } }], messages: [mensagem(CLIENTE, "quero orçamento", ANUNCIO)] });
    expect(db.conversas).toHaveLength(1);
    expect(db.mensagens).toHaveLength(1);
    expect(db.leads).toHaveLength(1);
    expect(db.leads[0]).toMatchObject({ origem: "META_ADS", adId: ANUNCIO.source_id, telefone: CLIENTE });
  });

  it("a continuação da conversa de anúncio é guardada, nos dois sentidos", async () => {
    await aviso(PESSOAL, "messages", { messages: [mensagem(CLIENTE, "quero orçamento", ANUNCIO)] });
    await aviso(PESSOAL, "messages", { messages: [mensagem(CLIENTE, "é uma laje de 200 m²")] });
    await aviso(PESSOAL, "smb_message_echoes", { message_echoes: [{ id: "wamid.eco1", to: CLIENTE, timestamp: "1795600100", type: "text", text: { body: "pode mandar a planta?" } }] });
    expect(db.conversas).toHaveLength(1);
    expect(db.mensagens).toHaveLength(3);
    expect(db.leads).toHaveLength(1);
  });

  it("o mesmo cliente sem o 9 no número continua na mesma conversa", async () => {
    await aviso(PESSOAL, "messages", { messages: [mensagem(CLIENTE, "quero orçamento", ANUNCIO)] });
    await aviso(PESSOAL, "messages", { messages: [mensagem("558288887777", "oi, sou eu de novo")] });
    expect(db.conversas).toHaveLength(1);
    expect(db.mensagens).toHaveLength(2);
  });

  it("resposta do celular para quem não veio de anúncio não é guardada", async () => {
    await aviso(PESSOAL, "smb_message_echoes", { message_echoes: [{ id: "wamid.eco2", to: AMIGO, timestamp: "1795600100", type: "text", text: { body: "já tô indo" } }] });
    expect(db.conversas).toHaveLength(0);
    expect(db.mensagens).toHaveLength(0);
  });

  it("histórico antigo do celular nunca é guardado", async () => {
    await aviso(PESSOAL, "history", { history: [{ threads: [{ id: AMIGO, messages: [{ id: "wamid.h1", from: AMIGO, timestamp: "1790000000", type: "text", text: { body: "conversa velha" } }] }] }] });
    expect(db.conversas).toHaveLength(0);
    expect(db.mensagens).toHaveLength(0);
  });
});

describe("os outros números continuam como sempre", () => {
  it("número só da empresa guarda conversa comum, resposta do celular e histórico", async () => {
    await aviso(EMPRESA, "messages", { messages: [mensagem(CLIENTE, "bom dia, vocês impermeabilizam piscina?")] });
    await aviso(EMPRESA, "smb_message_echoes", { message_echoes: [{ id: "wamid.eco3", to: AMIGO, timestamp: "1795600100", type: "text", text: { body: "segue o orçamento" } }] });
    await aviso(EMPRESA, "history", { history: [{ threads: [{ id: "5582955554444", messages: [{ id: "wamid.h2", from: "5582955554444", timestamp: "1790000000", type: "text", text: { body: "antiga" } }] }] }] });
    expect(db.conversas).toHaveLength(3);
    expect(db.mensagens).toHaveLength(3);
    expect(db.leads).toHaveLength(1);
  });

  it("sem lista no servidor, o número pessoal também guardaria tudo (a trava depende da lista)", async () => {
    delete process.env.WHATSAPP_SO_ANUNCIO_NUMEROS;
    await aviso(PESSOAL, "messages", { messages: [mensagem(AMIGO, "e aí?")] });
    expect(db.conversas).toHaveLength(1);
  });
});
