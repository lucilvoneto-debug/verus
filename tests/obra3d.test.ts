import { describe, expect, it } from "vitest";
import { juntaMedicao, leMedicao, obra3dDe, obra3dPorSlug, urlObra3d } from "@/lib/obras/obra3d";

describe("obra 3D", () => {
  it("acha a página pelo nome da obra", () => {
    expect(obra3dDe("Mahi Patacho - impermeabilização")?.slug).toBe("mahi-patacho");
    expect(obra3dDe("Residencial Togni")).toBeNull();
    expect(urlObra3d(obra3dPorSlug("mahi-patacho")!)).toMatch(/^\/obra3d\/mahi-patacho-[0-9a-f]{8}\/index\.html$/);
  });
  it("junta a medição e tira o que voltou a não iniciado", () => {
    const a = juntaMedicao({}, { "ter-O101-bwc-1": { s: 2, d: "2026-11-25" }, "ter-O101-varanda-1": { s: 1, d: "2026-11-25" } });
    expect(Object.keys(a)).toHaveLength(2);
    const b = juntaMedicao(a, { "ter-O101-varanda-1": { s: 0, d: "" } });
    expect(b).toEqual({ "ter-O101-bwc-1": { s: 2, d: "2026-11-25" } });
  });
  it("ignora o que vier fora do formato", () => {
    expect(juntaMedicao({}, { "x y": { s: 2, d: "2026-11-25" }, ok1: { s: 9, d: "2026-11-25" }, ok2: { s: 2, d: "ontem" }, ok3: "feito" })).toEqual({});
    expect(juntaMedicao({}, null)).toEqual({});
    expect(leMedicao("isto não é json")).toEqual({});
  });
});
