import { describe, expect, it } from "vitest";
import { cifrar, decifrar } from "@/lib/inter/cripto";

describe("cifra das credenciais do Inter", () => {
  it("volta o mesmo texto e nunca grava o original", () => {
    process.env.NEXTAUTH_SECRET = "teste";
    const segredo = "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----";
    const guardado = cifrar(segredo);
    expect(guardado).not.toContain("PRIVATE");
    expect(decifrar(guardado)).toBe(segredo);
  });

  it("não abre com outra chave do servidor", () => {
    process.env.NEXTAUTH_SECRET = "um";
    const g = cifrar("x");
    process.env.NEXTAUTH_SECRET = "outro";
    expect(() => decifrar(g)).toThrow();
  });
});
