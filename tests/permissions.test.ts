import { describe, expect, it } from "vitest";
import { autorizaRota, moduloDaRota, PAPEIS, podeEscrever, podeExcluir, podeLer } from "@/lib/permissions";

describe("moduloDaRota", () => {
  it("mapeia API e dashboard para o mesmo módulo", () => {
    expect(moduloDaRota("/api/contas-receber/abc/receber")).toBe("financeiro");
    expect(moduloDaRota("/dashboard/financeiro")).toBe("financeiro");
    expect(moduloDaRota("/api/colaboradores")).toBe("equipes");
    expect(moduloDaRota("/dashboard/equipes")).toBe("equipes");
    expect(moduloDaRota("/dashboard")).toBe("dashboard");
  });
  it("não confunde prefixo parcial", () => {
    expect(moduloDaRota("/api/obra/token123")).toBeNull(); // rota pública de obra, não /api/obras
    expect(moduloDaRota("/api/proposta/x")).toBeNull();
  });
});

describe("matriz", () => {
  it("ADMIN lê e escreve tudo", () => {
    for (const m of ["financeiro", "usuarios", "configuracoes", "obras", "crm"] as const) {
      expect(podeLer("ADMIN", m)).toBe(true);
      expect(podeEscrever("ADMIN", m)).toBe(true);
    }
  });
  it("TECNICO não vê financeiro nem CRM, mas escreve no diário de obra", () => {
    expect(podeLer("TECNICO", "financeiro")).toBe(false);
    expect(podeLer("TECNICO", "crm")).toBe(false);
    expect(autorizaRota("TECNICO", "/api/obras/1/diario", "POST")).toBe(true);
    expect(autorizaRota("TECNICO", "/api/contas-pagar", "GET")).toBe(false);
  });
  it("COMERCIAL escreve orçamento e não mexe em usuários", () => {
    expect(autorizaRota("COMERCIAL", "/api/orcamento", "POST")).toBe(true);
    expect(autorizaRota("COMERCIAL", "/api/usuarios", "POST")).toBe(false);
    expect(autorizaRota("COMERCIAL", "/api/usuarios", "GET")).toBe(true); // selects de responsável
  });
  it("só ADMIN/GESTOR excluem; documentos e notificações decidem na rota", () => {
    expect(podeExcluir("ADMIN")).toBe(true);
    expect(podeExcluir("GESTOR")).toBe(true);
    expect(podeExcluir("SUPERVISOR")).toBe(false);
    expect(autorizaRota("SUPERVISOR", "/api/obras/1", "DELETE")).toBe(false);
    expect(autorizaRota("SUPERVISOR", "/api/anexos/1", "DELETE")).toBe(true);
    expect(autorizaRota("TECNICO", "/api/notificacoes/1", "DELETE")).toBe(true);
    expect(autorizaRota("GESTOR", "/api/usuarios/1", "DELETE")).toBe(false); // usuários: só ADMIN
  });
  it("papel desconhecido é negado; rota fora da tabela é liberada", () => {
    expect(autorizaRota("CLIENTE", "/api/clientes", "GET")).toBe(false);
    expect(autorizaRota(undefined, "/dashboard/obras", "GET")).toBe(false);
    expect(autorizaRota("TECNICO", "/api/proposta/x", "GET")).toBe(true);
  });
  it("todo papel enxerga o dashboard e as notificações", () => {
    for (const p of PAPEIS) {
      expect(podeLer(p, "dashboard")).toBe(true);
      expect(podeLer(p, "notificacoes")).toBe(true);
    }
  });
});
