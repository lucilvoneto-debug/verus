import crypto from "node:crypto";

/**
 * Cifra o que o banco entrega (segredo, certificado, chave) antes de gravar.
 * A chave vem de INTER_CRYPTO_KEY ou, sem ela, do NEXTAUTH_SECRET do servidor:
 * quem copiar o banco de dados sem o servidor não consegue usar a conta.
 * Trocar o NEXTAUTH_SECRET obriga a cadastrar o Inter de novo na tela.
 */
function chave(): Buffer {
  const base = process.env.INTER_CRYPTO_KEY || process.env.NEXTAUTH_SECRET;
  if (!base) throw new Error("Servidor sem NEXTAUTH_SECRET: não dá para guardar a chave do banco com segurança.");
  return crypto.createHash("sha256").update(`verus-inter:${base}`).digest();
}

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), dados].map((b) => b.toString("base64")).join(".");
}

export function decifrar(guardado: string): string {
  const [iv, tag, dados] = guardado.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", chave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]).toString("utf8");
}
