import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// O aplicativo da Meta é dividido com outro sistema. Estes testes travam a
// regra: a inscrição sempre leva o endereço deste sistema, nunca mexe numa
// conta que tem números de fora e nunca fica valendo sem confirmação.

const linhas: { phoneNumberId: string }[] = [];
vi.mock("@/lib/prisma", () => ({
  prisma: { linhaWhatsapp: { findMany: vi.fn(async () => linhas) } },
}));

import { enderecoWebhookProprio, entregaChegaAqui, garantirEntregaPropria } from "@/lib/whatsapp/meta";

const AQUI = "https://verus.exemplo.com.br/api/webhooks/meta";
const PADRAO = "https://outro-sistema.exemplo.com.br/api/whatsapp/meta/webhook";

type Chamada = { metodo: string; caminho: string; corpo: any };
let chamadas: Chamada[] = [];

/** Meta de mentira: `numeros` da conta, `inscrito` e o que ela confirma no fim. */
function metaFalsa(opts: {
  numeros: string[];
  inscrito?: boolean;
  confirma?: "aqui" | "padrao";
  falhaConta?: boolean;
  falhaNumero?: boolean;
}) {
  let numeroTemEndereco = false;
  let contaTemEndereco = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const caminho = String(url).replace("https://graph.facebook.com/v21.0/", "");
      const metodo = init?.method ?? "GET";
      const corpo = init?.body ? JSON.parse(String(init.body)) : null;
      chamadas.push({ metodo, caminho, corpo });
      const ok = (d: unknown) => ({ ok: true, status: 200, json: async () => d });
      const erro = (m: string) => ({ ok: false, status: 400, json: async () => ({ error: { message: m, code: 100 } }) });

      if (metodo === "GET" && caminho.startsWith("WABA/phone_numbers")) return ok({ data: opts.numeros.map((id) => ({ id })) });
      if (metodo === "GET" && caminho === "WABA/subscribed_apps") return ok({ data: opts.inscrito ? [{}] : [] });
      if (metodo === "POST" && caminho === "WABA/subscribed_apps") {
        if (opts.falhaConta) return erro("conta recusou");
        contaTemEndereco = true;
        return ok({ success: true });
      }
      if (metodo === "DELETE" && caminho === "WABA/subscribed_apps") return ok({ success: true });
      if (metodo === "POST" && caminho === "FONE") {
        if (opts.falhaNumero) return erro("número recusou");
        numeroTemEndereco = true;
        return ok({ success: true });
      }
      if (metodo === "GET" && caminho.startsWith("FONE?fields=webhook_configuration")) {
        const cfg: Record<string, string> = { application: PADRAO };
        if (opts.confirma !== "padrao") {
          if (numeroTemEndereco) cfg.phone_number = AQUI;
          if (contaTemEndereco) cfg.whatsapp_business_account = AQUI;
        }
        return ok({ webhook_configuration: cfg });
      }
      return erro(`chamada inesperada: ${metodo} ${caminho}`);
    }),
  );
}

beforeEach(() => {
  chamadas = [];
  linhas.length = 0;
  process.env.APP_URL = "https://verus.exemplo.com.br";
  process.env.META_WEBHOOK_VERIFY_TOKEN = "segredo-de-teste";
  process.env.META_ACCESS_TOKEN = "token-de-teste";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enderecoWebhookProprio", () => {
  it("monta o endereço a partir do APP_URL e recusa o que não é https", () => {
    expect(enderecoWebhookProprio()).toBe(AQUI);
    process.env.APP_URL = "https://verus.exemplo.com.br/";
    expect(enderecoWebhookProprio()).toBe(AQUI);
    process.env.APP_URL = "http://localhost:3000";
    process.env.NEXTAUTH_URL = "";
    expect(enderecoWebhookProprio()).toBeNull();
  });
});

describe("garantirEntregaPropria", () => {
  it("conta só com o número daqui: inscreve a conta e o número, sempre com o endereço próprio", async () => {
    metaFalsa({ numeros: ["FONE"] });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r).toEqual({ ok: true });
    const conta = chamadas.find((c) => c.metodo === "POST" && c.caminho === "WABA/subscribed_apps");
    expect(conta?.corpo).toEqual({ override_callback_uri: AQUI, verify_token: "segredo-de-teste" });
    const numero = chamadas.find((c) => c.metodo === "POST" && c.caminho === "FONE");
    expect(numero?.corpo).toEqual({ webhook_configuration: { override_callback_uri: AQUI, verify_token: "segredo-de-teste" } });
  });

  it("nunca inscreve a conta sem endereço (corpo vazio mandaria tudo pro outro sistema)", async () => {
    metaFalsa({ numeros: ["FONE"] });
    await garantirEntregaPropria("WABA", "FONE");
    for (const c of chamadas.filter((x) => x.metodo === "POST" && x.caminho === "WABA/subscribed_apps")) {
      expect(c.corpo?.override_callback_uri).toBe(AQUI);
    }
  });

  it("conta dividida com número de outro sistema: não toca na conta, só no número", async () => {
    metaFalsa({ numeros: ["FONE", "FONE_DO_OUTRO_SISTEMA"], inscrito: true });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(true);
    expect(chamadas.some((c) => c.metodo === "POST" && c.caminho === "WABA/subscribed_apps")).toBe(false);
    expect(chamadas.some((c) => c.metodo === "DELETE")).toBe(false);
    expect(chamadas.some((c) => c.metodo === "POST" && c.caminho === "FONE")).toBe(true);
  });

  it("conta dividida sem inscrição do aplicativo: recusa e não muda nada", async () => {
    metaFalsa({ numeros: ["FONE", "FONE_DO_OUTRO_SISTEMA"], inscrito: false });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/outro sistema/);
    expect(chamadas.some((c) => c.metodo !== "GET")).toBe(false);
  });

  it("a Meta não confirma a entrega aqui: desfaz a inscrição e diz o motivo", async () => {
    metaFalsa({ numeros: ["FONE"], confirma: "padrao" });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/não confirmou/);
    expect(chamadas.some((c) => c.metodo === "DELETE" && c.caminho === "WABA/subscribed_apps")).toBe(true);
  });

  it("conta e número recusam: fica sem inscrição e devolve os dois motivos", async () => {
    metaFalsa({ numeros: ["FONE"], falhaConta: true, falhaNumero: true });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/conta recusou/);
    expect(r.motivo).toMatch(/número recusou/);
    expect(chamadas.some((c) => c.metodo === "DELETE")).toBe(false);
  });

  it("sem o segredo do aperto de mão: não chama a Meta", async () => {
    metaFalsa({ numeros: ["FONE"] });
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(false);
    expect(chamadas).toHaveLength(0);
  });

  it("número já cadastrado como linha daqui conta como nosso", async () => {
    linhas.push({ phoneNumberId: "FONE_ANTIGO" });
    metaFalsa({ numeros: ["FONE", "FONE_ANTIGO"] });
    const r = await garantirEntregaPropria("WABA", "FONE");
    expect(r.ok).toBe(true);
    expect(chamadas.some((c) => c.metodo === "POST" && c.caminho === "WABA/subscribed_apps")).toBe(true);
  });
});

describe("entregaChegaAqui", () => {
  it("é verdade só quando o endereço que vale é o deste sistema", async () => {
    metaFalsa({ numeros: ["FONE"] });
    expect(await entregaChegaAqui("FONE")).toBe(false); // só o endereço padrão do aplicativo
    await garantirEntregaPropria("WABA", "FONE");
    expect(await entregaChegaAqui("FONE")).toBe(true);
  });
});
