"use client";

import { useEffect, useState } from "react";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

interface Etapa { nome: string; status: string; dataPrevista: string; dataRealizada?: string | null }
interface Diario { data: string; etapa?: string | null; descricao: string; m2?: number | null; fotoUrl?: string | null; fotos?: string | null; condicaoTempo?: string | null; percentualObra?: number | null }
interface Obra {
  numero: string; nome: string; endereco: string; status: string;
  dataInicio: string; previsaoTermino: string; dataConclusao?: string | null;
  cliente: { nome: string }; progresso: number; etapas: Etapa[]; diarios: Diario[];
  empresa: { nome: string; telefone: string };
}

const statusEtapa: Record<string, { txt: string; cor: string }> = {
  CONCLUIDA: { txt: "Concluída", cor: "#1D9E75" }, CONCLUIDO: { txt: "Concluída", cor: "#1D9E75" },
  EM_ANDAMENTO: { txt: "Em andamento", cor: "#2D7DD2" }, ANDAMENTO: { txt: "Em andamento", cor: "#2D7DD2" },
  PENDENTE: { txt: "Pendente", cor: "#9CA3AF" },
};

export default function ObraPublica({ params }: { params: { token: string } }) {
  const [o, setO] = useState<Obra | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/obra/${params.token}`)
      .then((r) => r.json())
      .then((j) => (j.error ? setErro(j.error) : setO(j)))
      .catch(() => setErro("Não consegui carregar a obra."));
  }, [params.token]);

  if (erro) return <Centro><div style={{ color: "#DC2626" }}>{erro}</div></Centro>;
  if (!o) return <Centro><div style={{ color: "#6B7280" }}>Carregando obra…</div></Centro>;

  function fotos(d: Diario): string[] {
    const arr: string[] = [];
    if (d.fotoUrl) arr.push(d.fotoUrl);
    if (d.fotos) { try { const p = JSON.parse(d.fotos); if (Array.isArray(p)) arr.push(...p); } catch { /* string simples */ if (typeof d.fotos === "string" && d.fotos.startsWith("http")) arr.push(d.fotos); } }
    return Array.from(new Set(arr)).slice(0, 6);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F9", padding: "24px 12px", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ background: "#0F5E7E", color: "#fff", borderRadius: "12px 12px 0 0", padding: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{o.empresa.nome} · acompanhamento de obra</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{o.nome}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>Obra {o.numero} · {o.endereco}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
          {/* progresso */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "#0A4258" }}>Andamento</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0F5E7E" }}>{o.progresso}%</span>
          </div>
          <div style={{ height: 12, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${o.progresso}%`, height: "100%", background: "#1D9E75", transition: "width .4s" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 16, fontSize: 13, color: "#374151" }}>
            <div><b>Início:</b> {fmtData(o.dataInicio)}</div>
            <div><b>Previsão:</b> {fmtData(o.previsaoTermino)}</div>
            {o.dataConclusao && <div><b>Concluída:</b> {fmtData(o.dataConclusao)}</div>}
            <div><b>Cliente:</b> {o.cliente?.nome}</div>
          </div>

          {/* etapas */}
          {o.etapas.length > 0 && (
            <>
              <div style={{ fontWeight: 700, color: "#0A4258", margin: "24px 0 10px" }}>Etapas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {o.etapas.map((e, i) => {
                  const s = statusEtapa[e.status] || { txt: e.status, cor: "#9CA3AF" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: s.cor, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#111827" }}>{e.nome}</span>
                      <span style={{ fontSize: 12, color: s.cor, fontWeight: 600 }}>{s.txt}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF", width: 78, textAlign: "right" }}>{fmtData(e.dataRealizada || e.dataPrevista)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* diário / fotos */}
          <div style={{ fontWeight: 700, color: "#0A4258", margin: "24px 0 10px" }}>Diário da obra</div>
          {o.diarios.length === 0 && <div style={{ fontSize: 14, color: "#6B7280" }}>Ainda sem registros.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {o.diarios.map((d, i) => {
              const fs = fotos(d);
              return (
                <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280" }}>
                    <span>{fmtData(d.data)}{d.etapa ? ` · ${d.etapa}` : ""}{d.condicaoTempo ? ` · ${d.condicaoTempo}` : ""}</span>
                    {d.m2 != null && <span>{d.m2} m²</span>}
                  </div>
                  <div style={{ fontSize: 14, color: "#111827", marginTop: 4, whiteSpace: "pre-line" }}>{d.descricao}</div>
                  {fs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {fs.map((src, k) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={k} src={src} alt="foto da obra" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, fontSize: 12, color: "#6B7280", textAlign: "center" }}>
            {o.empresa.nome}{o.empresa.telefone ? ` · ${o.empresa.telefone}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F4F7F9", fontFamily: "system-ui" }}>{children}</div>;
}
