import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { paraCsv, periodoDe, resumirOrcamentos } from "@/lib/relatorios";

describe("paraCsv", () => {
  it("usa ; como separador, vírgula decimal, data pt-BR e BOM", () => {
    const csv = paraCsv([{ nome: "Obra; A", valor: 1234.5, data: new Date(2026, 8, 11), vazio: null }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const linhas = csv.slice(1).split("\r\n");
    expect(linhas[0]).toBe("nome;valor;data;vazio");
    expect(linhas[1]).toBe('"Obra; A";1234,5;11/09/2026;');
  });
  it("escapa aspas e quebras de linha", () => {
    const csv = paraCsv([{ t: 'diz "oi"\nlinha 2' }]);
    expect(csv).toContain('"diz ""oi""\nlinha 2"');
  });
  it("lista vazia devolve só o BOM", () => {
    expect(paraCsv([])).toBe("\uFEFF");
  });
});

describe("periodoDe", () => {
  it("custom respeita início/fim e fecha o dia final", () => {
    const p = periodoDe(null, "2026-01-10", "2026-01-20");
    expect(p.inicio.toISOString().slice(0, 10)).toBe("2026-01-10");
    expect(p.fim.getHours()).toBe(23);
  });
  it("'mes' começa no dia 1", () => {
    expect(periodoDe("mes").inicio.getDate()).toBe(1);
  });
});

describe("resumirOrcamentos", () => {
  const base = { cliente: "", criadoEm: new Date(), custoEstimado: 0, margem: 0, m2: 0, numero: "" };
  it("ignora rascunho na taxa e agrupa por vendedor", () => {
    const r = resumirOrcamentos([
      { ...base, vendedor: "Ana", status: "APROVADO", total: 1000 },
      { ...base, vendedor: "Ana", status: "RECUSADO", total: 500 },
      { ...base, vendedor: "Bia", status: "RASCUNHO", total: 900 },
      { ...base, vendedor: "Bia", status: "ENVIADO", total: 700 },
    ]);
    expect(r.total).toBe(4);
    expect(r.aprovados).toBe(1);
    expect(r.taxa).toBeCloseTo(33.33, 1); // 1 aprovado / 3 enviados
    expect(r.ticketMedio).toBe(1000);
    expect(r.porVendedor[0]).toMatchObject({ vendedor: "Ana", enviados: 2, aprovados: 1, taxa: 50 });
    expect(r.porVendedor[1]).toMatchObject({ vendedor: "Bia", enviados: 1, aprovados: 0 });
  });
});
