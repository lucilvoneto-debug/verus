import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { normalizarTelefoneBR, renderizarTemplate, tipoMidiaDoMime } from "@/lib/whatsapp/meta";

describe("renderizarTemplate", () => {
  it("substitui {{n}} pelos parâmetros e mantém os que faltam", () => {
    expect(renderizarTemplate("Olá {{1}}, sua obra {{2}} está {{3}}", ["Ana", "12"])).toBe("Olá Ana, sua obra 12 está {{3}}");
  });
});

describe("tipoMidiaDoMime", () => {
  it("classifica por prefixo", () => {
    expect(tipoMidiaDoMime("image/png")).toBe("image");
    expect(tipoMidiaDoMime("video/mp4")).toBe("video");
    expect(tipoMidiaDoMime("audio/ogg")).toBe("audio");
    expect(tipoMidiaDoMime("application/pdf")).toBe("document");
  });
});

describe("normalizarTelefoneBR", () => {
  it("adiciona DDI e limpa formatação", () => {
    expect(normalizarTelefoneBR("(82) 99166-9449")).toBe("5582991669449");
    expect(normalizarTelefoneBR("+55 82 99166-9449")).toBe("5582991669449");
  });
});
