import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { MAX_BYTES, storageStatus, validarArquivo } from "@/lib/storage";

describe("validarArquivo", () => {
  it("aceita imagem e PDF dentro do limite", () => {
    expect(validarArquivo("image/jpeg", 1024)).toBeNull();
    expect(validarArquivo("application/pdf", MAX_BYTES)).toBeNull();
  });
  it("rejeita executável, vazio e acima do teto", () => {
    expect(validarArquivo("application/x-msdownload", 10)).toMatch(/não permitido/);
    expect(validarArquivo("image/png", 0)).toMatch(/vazio/);
    expect(validarArquivo("image/png", MAX_BYTES + 1)).toMatch(/acima/);
  });
});

describe("storageStatus", () => {
  it("cai para db quando supabase não está completo", () => {
    process.env.STORAGE_PROVIDER = "supabase";
    delete process.env.SUPABASE_URL;
    expect(storageStatus().provider).toBe("db");
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    expect(storageStatus().provider).toBe("supabase");
  });
});
