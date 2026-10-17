import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigir } from "@/lib/sessao";
import { cifrar } from "@/lib/inter/cripto";
import { esquecerCredenciais, testarCredenciais, validadeCertificado } from "@/lib/inter/cliente";
import { contaDoInter } from "@/lib/inter/extrato";

export const dynamic = "force-dynamic";

/** Situação da ligação. Nunca devolve segredo, certificado nem chave. */
export async function GET() {
  const r = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (!r) return NextResponse.json({ ligado: false });
  return NextResponse.json({
    ligado: r.ativa,
    clientIdFinal: r.clientId.slice(-4),
    certValidoAte: r.certValidoAte,
    testadoEm: r.testadoEm,
    permissoes: r.permissoes ? JSON.parse(r.permissoes) : null,
    ultimoErro: r.ultimoErro,
    saldo: r.saldo,
    saldoEm: r.saldoEm,
    extratoSyncEm: r.extratoSyncEm,
  });
}

const schema = z.object({
  clientId: z.string().trim().min(10, "Cole o Client ID"),
  clientSecret: z.string().trim().min(10, "Cole o Client Secret"),
  cert: z.string().includes("BEGIN CERTIFICATE", { message: "O arquivo .crt não parece ser o certificado do Inter" }),
  chave: z.string().includes("PRIVATE KEY", { message: "O arquivo .key não parece ser a chave do Inter" }),
});

export async function PUT(req: NextRequest) {
  const auth = await exigir("configuracoes", "escrever");
  if (auth.erro) return auth.erro;
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const d = p.data;

  let validade: Date;
  try {
    validade = validadeCertificado(d.cert);
  } catch {
    return NextResponse.json({ error: "Não consegui ler o certificado (.crt)." }, { status: 400 });
  }

  let teste: Awaited<ReturnType<typeof testarCredenciais>>;
  try {
    teste = await testarCredenciais(d);
  } catch (e) {
    return NextResponse.json({ error: `Não consegui falar com o Inter: ${e instanceof Error ? e.message : e}` }, { status: 502 });
  }
  if (!Object.values(teste.permissoes).some(Boolean)) {
    return NextResponse.json(
      { error: "O Inter recusou esses dados. Confira se o Client ID, o Client Secret e os arquivos são da mesma integração.", detalhes: teste.erros },
      { status: 400 },
    );
  }

  const conta = await contaDoInter().catch(() => null);
  const dados = {
    clientId: d.clientId,
    clientSecretCifr: cifrar(d.clientSecret),
    certCifr: cifrar(d.cert),
    chaveCifr: cifrar(d.chave),
    certValidoAte: validade,
    ativa: true,
    testadoEm: new Date(),
    permissoes: JSON.stringify(teste.permissoes),
    ultimoErro: teste.erros.length ? teste.erros.join(" | ").slice(0, 1000) : null,
    saldo: teste.saldo,
    saldoEm: teste.saldo != null ? new Date() : null,
    contaId: conta?.id ?? null,
    atualizadoPor: auth.sessao.name ?? auth.sessao.email ?? auth.sessao.id,
  };
  await prisma.integracaoBanco.upsert({ where: { banco: "INTER" }, create: { banco: "INTER", ...dados }, update: dados });
  esquecerCredenciais();
  return NextResponse.json({ ok: true, permissoes: teste.permissoes, saldo: teste.saldo, certValidoAte: validade });
}

/** Desliga a ligação (as credenciais cifradas ficam guardadas, mas não são mais usadas). */
export async function DELETE() {
  const auth = await exigir("configuracoes", "escrever");
  if (auth.erro) return auth.erro;
  await prisma.integracaoBanco.updateMany({ where: { banco: "INTER" }, data: { ativa: false } });
  esquecerCredenciais();
  return NextResponse.json({ ok: true });
}
