/**
 * Número que também é pessoal: o sistema guarda SÓ as conversas que chegam por
 * anúncio (a primeira mensagem traz a marca do anúncio da Meta). Conversa comum
 * desse número — família, amigo, fornecedor — não é gravada, nem o histórico
 * antigo que o WhatsApp oferece ao conectar.
 *
 * A lista fica em WHATSAPP_SO_ANUNCIO_NUMEROS, no servidor: números separados
 * por vírgula, em qualquer formato (com ou sem 55, com ou sem o 9). Lista vazia
 * = nada muda: todos os números guardam tudo, como sempre.
 *
 * Fica em variável do servidor, e não em tela, de propósito: a trava precisa
 * estar valendo ANTES de o número ser conectado, sem depender de alguém lembrar
 * de marcar uma opção.
 */

/** DDD + últimos 8 dígitos: a mesma pessoa com ou sem 55 e com ou sem o 9. */
export function chaveTelefone(v: string | null | undefined): string {
  let d = String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length < 10) return "";
  return d.slice(0, 2) + d.slice(-8);
}

export function numerosSoAnuncio(env: string | undefined = process.env.WHATSAPP_SO_ANUNCIO_NUMEROS): Set<string> {
  const out = new Set<string>();
  for (const parte of String(env ?? "").split(/[,;\n]/)) {
    const k = chaveTelefone(parte);
    if (k) out.add(k);
  }
  return out;
}

/** O número que recebeu o aviso (metadata.display_phone_number) está na lista? */
export function linhaSoAnuncio(numeroDaLinha: string | null | undefined, env?: string): boolean {
  const k = chaveTelefone(numeroDaLinha);
  return !!k && numerosSoAnuncio(env).has(k);
}

/** A mensagem chegou por clique em anúncio ou publicação impulsionada da Meta. */
export function veioDeAnuncio(referral: unknown): boolean {
  if (!referral || typeof referral !== "object") return false;
  const r = referral as Record<string, unknown>;
  return !!(r.ctwa_clid || r.source_id || r.source_type === "ad" || r.source_type === "post");
}
