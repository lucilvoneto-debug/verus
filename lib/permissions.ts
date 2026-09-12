/**
 * Matriz de permissão papel × módulo.
 *
 * Um único lugar decide o que cada papel pode ver (GET) e alterar
 * (POST/PUT/PATCH/DELETE). O middleware aplica a matriz em /api/* e
 * /dashboard/*; a Sidebar usa a mesma matriz para esconder o que o
 * usuário não acessa. Excluir (DELETE) fica restrito a ADMIN/GESTOR.
 *
 * Papéis:
 *   ADMIN       dono do sistema — tudo, inclusive usuários e configurações
 *   GESTOR      gerência — tudo, menos usuários/configurações
 *   SUPERVISOR  operação de obra
 *   ENGENHEIRO  operação + orçamento técnico
 *   COMERCIAL   vendas: clientes, CRM, WhatsApp, visitas, orçamentos, contratos
 *   FINANCEIRO  contas, fluxo de caixa, compras, medições, contratos
 *   TECNICO     campo: visitas, etapas, diário de obra
 */

export const PAPEIS = [
  "ADMIN",
  "GESTOR",
  "SUPERVISOR",
  "ENGENHEIRO",
  "COMERCIAL",
  "FINANCEIRO",
  "TECNICO",
] as const;
export type Papel = (typeof PAPEIS)[number];

export const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  SUPERVISOR: "Supervisor",
  ENGENHEIRO: "Engenheiro",
  COMERCIAL: "Comercial",
  FINANCEIRO: "Financeiro",
  TECNICO: "Técnico",
};

export type Modulo =
  | "dashboard"
  | "clientes"
  | "crm"
  | "whatsapp"
  | "atendimento"
  | "visita"
  | "orcamento"
  | "servicos"
  | "contratos"
  | "obras"
  | "etapas"
  | "equipes"
  | "agenda"
  | "medicoes"
  | "estoque"
  | "fabricantes"
  | "compras"
  | "fornecedores"
  | "financeiro"
  | "garantias"
  | "manutencao"
  | "gatilho-clima"
  | "pos-venda"
  | "documentos"
  | "relatorios"
  | "notificacoes"
  | "usuarios"
  | "configuracoes"
  | "campo"
  | "busca";

type Regra = { ler: readonly Papel[]; escrever: readonly Papel[] };

const TODOS = PAPEIS;
const GESTAO: readonly Papel[] = ["ADMIN", "GESTOR"];
const OPERACAO: readonly Papel[] = ["ADMIN", "GESTOR", "SUPERVISOR", "ENGENHEIRO"];
const OPERACAO_CAMPO: readonly Papel[] = [...OPERACAO, "TECNICO"];
const VENDAS: readonly Papel[] = ["ADMIN", "GESTOR", "COMERCIAL"];
const VENDAS_TEC: readonly Papel[] = [...VENDAS, "ENGENHEIRO", "SUPERVISOR"];
const DINHEIRO: readonly Papel[] = ["ADMIN", "GESTOR", "FINANCEIRO"];
const SEM_TECNICO: readonly Papel[] = PAPEIS.filter((p) => p !== "TECNICO");

export const MATRIZ: Record<Modulo, Regra> = {
  dashboard: { ler: TODOS, escrever: GESTAO },
  busca: { ler: TODOS, escrever: [] },
  notificacoes: { ler: TODOS, escrever: TODOS },
  campo: { ler: OPERACAO_CAMPO, escrever: OPERACAO_CAMPO },

  clientes: { ler: TODOS, escrever: [...VENDAS_TEC, "FINANCEIRO"] },
  crm: { ler: SEM_TECNICO, escrever: VENDAS_TEC },
  whatsapp: { ler: SEM_TECNICO, escrever: VENDAS_TEC },
  atendimento: { ler: TODOS, escrever: [...VENDAS_TEC, "TECNICO"] },
  visita: { ler: TODOS, escrever: OPERACAO_CAMPO.concat("COMERCIAL") },
  orcamento: { ler: SEM_TECNICO, escrever: VENDAS_TEC },
  servicos: { ler: TODOS, escrever: OPERACAO.concat("COMERCIAL") },
  contratos: { ler: SEM_TECNICO, escrever: [...VENDAS, "FINANCEIRO"] },

  obras: { ler: TODOS, escrever: OPERACAO_CAMPO },
  etapas: { ler: TODOS, escrever: OPERACAO_CAMPO },
  equipes: { ler: TODOS, escrever: OPERACAO },
  agenda: { ler: TODOS, escrever: OPERACAO_CAMPO.concat("COMERCIAL") },
  medicoes: { ler: SEM_TECNICO, escrever: OPERACAO.concat("FINANCEIRO") },

  estoque: { ler: TODOS, escrever: OPERACAO_CAMPO },
  fabricantes: { ler: TODOS, escrever: OPERACAO.concat("FINANCEIRO") },
  compras: { ler: SEM_TECNICO, escrever: OPERACAO.concat("FINANCEIRO") },
  fornecedores: { ler: SEM_TECNICO, escrever: OPERACAO.concat("FINANCEIRO") },

  financeiro: { ler: DINHEIRO, escrever: DINHEIRO },

  garantias: { ler: TODOS, escrever: OPERACAO.concat("COMERCIAL") },
  manutencao: { ler: SEM_TECNICO, escrever: OPERACAO.concat("COMERCIAL") },
  "gatilho-clima": { ler: SEM_TECNICO, escrever: VENDAS },
  "pos-venda": { ler: TODOS, escrever: OPERACAO_CAMPO.concat("COMERCIAL") },
  documentos: { ler: TODOS, escrever: SEM_TECNICO },

  relatorios: { ler: [...GESTAO, "FINANCEIRO", "SUPERVISOR", "ENGENHEIRO", "COMERCIAL"], escrever: [] },
  usuarios: { ler: TODOS, escrever: ["ADMIN"] },
  configuracoes: { ler: GESTAO, escrever: ["ADMIN"] },
};

/** Só ADMIN e GESTOR apagam registro; o resto inativa/cancela. */
const PODE_EXCLUIR: readonly Papel[] = GESTAO;

/** Módulos em que a rota decide o DELETE (ex.: apagar o próprio anexo/notificação). */
const EXCLUSAO_PELA_ROTA: ReadonlySet<Modulo> = new Set<Modulo>(["notificacoes", "documentos", "whatsapp", "usuarios"]);

/** Prefixo de rota de API → módulo. Ordem importa: o primeiro que casar vence. */
const API_MODULO: Array<[string, Modulo]> = [
  ["/api/clientes", "clientes"],
  ["/api/leads", "crm"],
  ["/api/whatsapp", "whatsapp"],
  ["/api/atendimentos", "atendimento"],
  ["/api/visita", "visita"],
  ["/api/orcamento", "orcamento"],
  ["/api/servicos", "servicos"],
  ["/api/contratos", "contratos"],
  ["/api/obras", "obras"],
  ["/api/etapas", "etapas"],
  ["/api/colaboradores", "equipes"],
  ["/api/agenda", "agenda"],
  ["/api/clima", "agenda"],
  ["/api/medicoes", "medicoes"],
  ["/api/materiais", "estoque"],
  ["/api/movimentacoes", "estoque"],
  ["/api/fabricantes", "fabricantes"],
  ["/api/compras", "compras"],
  ["/api/fornecedores", "fornecedores"],
  ["/api/contas-pagar", "financeiro"],
  ["/api/contas-receber", "financeiro"],
  ["/api/fluxo-caixa", "financeiro"],
  ["/api/integracoes/nfe", "financeiro"],
  ["/api/garantias", "garantias"],
  ["/api/manutencao", "manutencao"],
  ["/api/gatilho-clima", "gatilho-clima"],
  ["/api/chamados", "pos-venda"],
  ["/api/anexos", "documentos"],
  ["/api/relatorios", "relatorios"],
  ["/api/notificacoes", "notificacoes"],
  ["/api/usuarios", "usuarios"],
  ["/api/configuracoes", "configuracoes"],
  ["/api/integracoes", "configuracoes"],
  ["/api/campo", "campo"],
  ["/api/busca", "busca"],
];

const DASHBOARD_MODULO: Array<[string, Modulo]> = [
  ["/dashboard/clientes", "clientes"],
  ["/dashboard/crm", "crm"],
  ["/dashboard/whatsapp", "whatsapp"],
  ["/dashboard/atendimento", "atendimento"],
  ["/dashboard/visita", "visita"],
  ["/dashboard/orcamento", "orcamento"],
  ["/dashboard/servicos", "servicos"],
  ["/dashboard/contratos", "contratos"],
  ["/dashboard/obras", "obras"],
  ["/dashboard/etapas", "etapas"],
  ["/dashboard/equipes", "equipes"],
  ["/dashboard/agenda", "agenda"],
  ["/dashboard/medicoes", "medicoes"],
  ["/dashboard/estoque", "estoque"],
  ["/dashboard/fabricantes", "fabricantes"],
  ["/dashboard/compras", "compras"],
  ["/dashboard/fornecedores", "fornecedores"],
  ["/dashboard/financeiro", "financeiro"],
  ["/dashboard/garantias", "garantias"],
  ["/dashboard/manutencao", "manutencao"],
  ["/dashboard/gatilho-clima", "gatilho-clima"],
  ["/dashboard/pos-venda", "pos-venda"],
  ["/dashboard/documentos", "documentos"],
  ["/dashboard/relatorios", "relatorios"],
  ["/dashboard/notificacoes", "notificacoes"],
  ["/dashboard/usuarios", "usuarios"],
  ["/dashboard/configuracoes", "configuracoes"],
  ["/dashboard/busca", "busca"],
  ["/dashboard", "dashboard"],
  ["/campo", "campo"],
];

function casa(pathname: string, prefixo: string): boolean {
  return pathname === prefixo || pathname.startsWith(prefixo + "/");
}

export function moduloDaRota(pathname: string): Modulo | null {
  const tabela = pathname.startsWith("/api/") ? API_MODULO : DASHBOARD_MODULO;
  for (const [prefixo, modulo] of tabela) {
    if (casa(pathname, prefixo)) return modulo;
  }
  return null;
}

export function papelValido(v: unknown): v is Papel {
  return typeof v === "string" && (PAPEIS as readonly string[]).includes(v);
}

export function podeLer(papel: string | undefined, modulo: Modulo): boolean {
  if (!papelValido(papel)) return false;
  return MATRIZ[modulo].ler.includes(papel);
}

export function podeEscrever(papel: string | undefined, modulo: Modulo): boolean {
  if (!papelValido(papel)) return false;
  return MATRIZ[modulo].escrever.includes(papel);
}

export function podeExcluir(papel: string | undefined): boolean {
  return papelValido(papel) && PODE_EXCLUIR.includes(papel);
}

/**
 * Decide se um papel pode chamar `method pathname`.
 * Rota fora da tabela (ex.: /api/proposta) libera — a proteção dela é outra.
 */
export function autorizaRota(papel: string | undefined, pathname: string, method: string): boolean {
  const modulo = moduloDaRota(pathname);
  if (!modulo) return true;
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return podeLer(papel, modulo);
  if (m === "DELETE") {
    // Nestes módulos a própria rota confere dono do registro; escrever basta.
    if (EXCLUSAO_PELA_ROTA.has(modulo)) return podeEscrever(papel, modulo);
    return podeExcluir(papel);
  }
  return podeEscrever(papel, modulo);
}
