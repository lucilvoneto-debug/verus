import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { categoriaDaContaPagar } from "@/lib/caixa/extrato";
describe("categoriaDaContaPagar", () => {
  it("gaveta escolhida vale", () => {
    expect(categoriaDaContaPagar("Mão de obra", "Aplicador - Josivaldo")).toBe("MAO_DE_OBRA");
    expect(categoriaDaContaPagar("Marketing", "Igor — vídeos e redes")).toBe("MARKETING");
    expect(categoriaDaContaPagar("Equipamento", "Frete da máquina")).toBe("EQUIPAMENTO");
    expect(categoriaDaContaPagar("Imposto e taxa", "Taxa de licença (TLI)")).toBe("IMPOSTO_TAXA");
    expect(categoriaDaContaPagar("Material", "Fardas")).toBe("MATERIAL");
  });
  it("texto livre antigo continua adivinhado", () => {
    expect(categoriaDaContaPagar("Folha", "Ajudante")).toBe("MAO_DE_OBRA");
    expect(categoriaDaContaPagar("Despesas", "Multa CREA")).toBe("IMPOSTO_TAXA");
  });
});
