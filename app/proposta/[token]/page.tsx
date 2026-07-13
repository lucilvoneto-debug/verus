"use client";

import { useEffect, useState } from "react";

const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

interface Item { descricao: string; area?: number | null; quantidade: number; unidade: string; precoUnit: number; subtotal: number }
interface Proposta {
  numero: string; status: string; validade: string; aprovadoEm?: string | null;
  condicaoPagamento?: string | null; prazoExecucao?: string | null; escopo?: string | null;
  subtotal: number; desconto: number; total: number;
  cliente: { nome: string; documento?: string | null; cidade?: string | null; uf?: string | null };
  itens: Item[];
  empresa: { nome: string; cnpj: string; telefone: string; email: string; endereco: string };
}

export default function PropostaPublica({ params }: { params: { token: string } }) {
  const [p, setP] = useState<Proposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proposta/${params.token}`)
      .then((r) => r.json())
      .then((j) => (j.error ? setErro(j.error) : setP(j)))
      .catch(() => setErro("Não consegui carregar a proposta."));
  }, [params.token]);

  async function agir(acao: "aprovar" | "recusar") {
    if (acao === "aprovar" && !nome.trim()) return setErro("Informe seu nome para aprovar.");
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/proposta/${params.token}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, nome, documento: doc }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha.");
      setFeito(j.status);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro.");
    } finally {
      setEnviando(false);
    }
  }

  if (erro && !p) return <Centro><div className="text-red-600">{erro}</div></Centro>;
  if (!p) return <Centro><div className="text-gray-500">Carregando proposta…</div></Centro>;

  const aprovado = p.status === "APROVADO" || feito === "APROVADO";
  const recusado = p.status === "RECUSADO" || feito === "RECUSADO";

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F9", padding: "24px 12px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* cabeçalho */}
        <div style={{ background: "#0F5E7E", color: "#fff", borderRadius: "12px 12px 0 0", padding: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{p.empresa.nome}{p.empresa.cnpj ? ` · CNPJ ${p.empresa.cnpj}` : ""}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>Proposta de Impermeabilização</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>Nº {p.numero} · válida até {fmtData(p.validade)}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
          {/* status */}
          {aprovado && <Faixa cor="#1D9E75">✓ Proposta APROVADA{p.aprovadoEm ? ` em ${fmtData(p.aprovadoEm)}` : ""}. A Verus entrará em contato.</Faixa>}
          {recusado && <Faixa cor="#9CA3AF">Proposta recusada.</Faixa>}

          {/* cliente */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 20 }}>
            <Bloco titulo="Cliente" texto={`${p.cliente.nome}${p.cliente.documento ? `\n${p.cliente.documento}` : ""}${p.cliente.cidade ? `\n${p.cliente.cidade}${p.cliente.uf ? "/" + p.cliente.uf : ""}` : ""}`} />
            <Bloco titulo="Prazo de execução" texto={p.prazoExecucao || "A combinar"} />
            <Bloco titulo="Pagamento" texto={p.condicaoPagamento || "A combinar"} />
          </div>

          {/* itens */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0F5E7E", color: "#fff" }}>
                <th style={thL}>Serviço</th>
                <th style={thR}>Qtd</th>
                <th style={thR}>Un.</th>
                <th style={thR}>Preço</th>
                <th style={thR}>Total</th>
              </tr>
            </thead>
            <tbody>
              {p.itens.map((it, i) => (
                <tr key={i} style={{ background: i % 2 ? "#F5F8FA" : "#fff" }}>
                  <td style={tdL}>{it.descricao}</td>
                  <td style={tdR}>{fmt(it.quantidade)}</td>
                  <td style={tdR}>{it.unidade}</td>
                  <td style={tdR}>R$ {fmt(it.precoUnit)}</td>
                  <td style={{ ...tdR, fontWeight: 700 }}>R$ {fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* totais */}
          <div style={{ marginTop: 12, marginLeft: "auto", width: 260 }}>
            <LinhaTotal label="Subtotal" valor={p.subtotal} />
            {p.desconto > 0 && <LinhaTotal label="Desconto" valor={-p.desconto} />}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #0F5E7E", fontSize: 18, fontWeight: 800, color: "#0A4258" }}>
              <span>Total</span><span>R$ {fmt(p.total)}</span>
            </div>
          </div>

          {/* escopo técnico */}
          {p.escopo && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, color: "#0A4258", marginBottom: 8 }}>Escopo dos serviços</div>
              <div style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-line", lineHeight: 1.55 }}>{p.escopo}</div>
            </div>
          )}

          {/* garantia */}
          <div style={{ marginTop: 20, background: "#E1EDF2", borderRadius: 8, padding: 16, fontSize: 13, color: "#0A4258" }}>
            <b>Garantia:</b> serviço executado conforme ABNT NBR 9575/9574, com garantia de 5 anos contra
            infiltração no sistema aplicado. Materiais de primeira linha. Inclui limpeza e preparo de substrato.
          </div>

          {/* aceite */}
          {!aprovado && !recusado && (
            <div style={{ marginTop: 24, borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
              <div style={{ fontWeight: 700, color: "#0A4258", marginBottom: 10 }}>Aprovar esta proposta</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <input placeholder="Seu nome *" value={nome} onChange={(e) => setNome(e.target.value)} style={input} />
                <input placeholder="CPF/CNPJ (opcional)" value={doc} onChange={(e) => setDoc(e.target.value)} style={input} />
              </div>
              {erro && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>{erro}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => agir("aprovar")} disabled={enviando} style={btnPrim}>
                  {enviando ? "Enviando…" : "✓ Aprovar proposta"}
                </button>
                <button onClick={() => agir("recusar")} disabled={enviando} style={btnGhost}>Recusar</button>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                Ao aprovar, você registra o aceite desta proposta (data, nome e IP ficam registrados).
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 12, color: "#6B7280", textAlign: "center" }}>
            {p.empresa.nome} · {p.empresa.telefone} {p.empresa.email ? `· ${p.empresa.email}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F4F7F9", fontFamily: "system-ui" }}>{children}</div>;
}
function Faixa({ cor, children }: { cor: string; children: React.ReactNode }) {
  return <div style={{ background: cor, color: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontWeight: 600 }}>{children}</div>;
}
function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6B7280", letterSpacing: 0.5 }}>{titulo}</div>
      <div style={{ fontSize: 14, color: "#111827", whiteSpace: "pre-line", marginTop: 2 }}>{texto}</div>
    </div>
  );
}
function LinhaTotal({ label, valor }: { label: string; valor: number }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, color: "#374151" }}><span>{label}</span><span>R$ {fmt(valor)}</span></div>;
}

const thL: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 12 };
const thR: React.CSSProperties = { textAlign: "right", padding: "8px 10px", fontSize: 12 };
const tdL: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #eee" };
const tdR: React.CSSProperties = { textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #eee" };
const input: React.CSSProperties = { flex: 1, minWidth: 180, border: "1px solid #D1D5DB", borderRadius: 8, padding: "10px 12px", fontSize: 14 };
const btnPrim: React.CSSProperties = { background: "#0F5E7E", color: "#fff", border: 0, borderRadius: 8, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 15 };
const btnGhost: React.CSSProperties = { background: "#fff", color: "#6B7280", border: "1px solid #D1D5DB", borderRadius: 8, padding: "12px 20px", fontWeight: 600, cursor: "pointer" };
