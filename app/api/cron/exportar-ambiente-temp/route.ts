/**
 * ROTA TEMPORÁRIA — migração do Verus pro servidor próprio (15/09/2026). APAGAR HOJE.
 *
 * A Vercel guarda 98 variáveis como "sensitive" e não devolve o valor nem pelo
 * painel nem pela CLI. Esta rota entrega o ambiente do processo em produção,
 * cifrado com a chave pública abaixo (AES-256-GCM + RSA-OAEP), pra quem tiver
 * o token de uso único. Só a chave privada, guardada no Mac do dono, abre.
 *
 * Vive em /api/cron porque o middleware libera esse prefixo sem cookie; NÃO
 * usa cronAuth de propósito (CRON_SECRET é justamente uma das sensíveis).
 * Autorizado pelo dono em 15/09/2026 ("b"). Removida no commit seguinte.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  constants,
  createCipheriv,
  createHash,
  publicEncrypt,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const TOKEN_SHA256 = "5e865b7888535b641ac1bce757170d3c83803a61de3649b3ce6a83f51d4babbe";
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxUTTujoepvGsQ/KQXVCE
3+9ybU05bIagMomN/Vt0SgKlf3ej+JByxhYGR4mvbouZqrd8ursHs0bzHNacbLoB
KlUSd/RBdIBR7exgJMP7E41u7l/Rva06n2GEtQnwxO2FIiVKe0x+xRbtO9XuHdKS
/75+BAQwmPl2zxKGChN2pfD/p2glK8w5iS7/Co1WLgJvEMg8V9HAcunVstafqQUm
AE55Y7zmB3cZzuENOmsT4UmRluZrzIOturduWSWyKp8e2Wbu8rLK6uS50pQzbAQF
gqxw8Q4ok6gddPH4a0Ch2gDp2pkJxRVWg7FeTThHOxfBmKWrIPMRmzd/5DkD6xqz
rMuvrCkfQXh4eDeglsVa6xaO2NXmNr8D/yoC/F1YnQi13YhwJCp5/mrAH6g6midz
MtmMM8+riB8re7+hB9/vsf9VAUOggAvyCKUCzMN4zlO3kT0STVckWcoxMFFLqSpQ
eitdHkvgBZkM7kViJtHG9a4b5gWP2pt4ijr8+F+yDDmlVkfPnXImNcmPh3liN0/Z
4AtAMMPzrtALTJtW+cdm3KaAL2wqahJz+/H0Vdy4sSK9jNp+IkoUK+9ySxsEhWno
Pk3EtKqcSFjr9kGb4LRZzifERd4mv/0S+/PlmtZfCXlcQEuV+yK+bWFX8KGMuww6
hK7f1xZjepeUmNXiRPTFXCECAwEAAQ==
-----END PUBLIC KEY-----`;

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const got = createHash("sha256").update(t).digest();
  const want = Buffer.from(TOKEN_SHA256, "hex");
  if (got.length !== want.length || !timingSafeEqual(got, want)) {
    return new NextResponse(null, { status: 404 });
  }

  const linhas = Object.entries(process.env)
    .filter(([k]) => !/^(NODE_|NEXT_RUNTIME|PATH$|PWD$|HOME$|SHLVL$|_$)/.test(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v ?? "")}`);
  const texto = linhas.join("\n") + "\n";

  const chave = randomBytes(32);
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave, iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  const chaveCifrada = publicEncrypt(
    { key: PUBLIC_KEY_PEM, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    chave
  );

  return NextResponse.json(
    {
      k: chaveCifrada.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      data: dados.toString("base64"),
      n: linhas.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
