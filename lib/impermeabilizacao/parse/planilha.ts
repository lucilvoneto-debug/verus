import * as XLSX from "xlsx";
import type { AmbienteEntrada, TipoAmbiente } from "../regras";
import { REGRAS } from "../regras";
import { classificarNome } from "../classificar";

/**
 * Lê planilha (.xlsx/.xls/.csv/.ods) com uma linha por ambiente.
 * Reconhece cabeçalhos flexíveis (pt-br), em qualquer ordem:
 *   nome/ambiente/local | area/area piso/m2 | perimetro | altura | box | tipo | qtd/repeticao
 */

const COLS: Record<string, string[]> = {
  nome: ["nome", "ambiente", "local", "descricao", "comodo", "compartimento", "item"],
  areaPiso: ["area", "area piso", "areapiso", "m2", "m²", "area (m2)", "piso", "area de piso"],
  perimetro: ["perimetro", "perímetro", "perim", "contorno"],
  altura: ["altura", "h", "subida", "altura parede"],
  boxComprimento: ["box", "boxe", "chuveiro", "box (m)", "comprimento box"],
  repeticao: ["qtd", "quantidade", "repeticao", "repetição", "rep", "unidades", "qty"],
  tipo: ["tipo", "categoria", "sistema"],
};

function normalizar(s: string): string {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function acharColuna(cabecalhos: string[], chave: string): number {
  const alvos = COLS[chave];
  for (let i = 0; i < cabecalhos.length; i++) {
    const h = normalizar(cabecalhos[i]);
    if (alvos.some((a) => h === normalizar(a))) return i;
  }
  // match parcial (contém)
  for (let i = 0; i < cabecalhos.length; i++) {
    const h = normalizar(cabecalhos[i]);
    if (alvos.some((a) => h.includes(normalizar(a)))) return i;
  }
  return -1;
}

function numero(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  // "1.234,56" ou "1234.56"
  const s = v.toString().trim().replace(/\s/g, "");
  const br = s.replace(/\./g, "").replace(",", ".");
  const n = Number(/,/.test(s) ? br : s.replace(",", "."));
  return isFinite(n) ? n : 0;
}

const TIPOS_VALIDOS = new Set(Object.keys(REGRAS));

function normalizarTipo(v: any): TipoAmbiente | null {
  const s = normalizar(v).toUpperCase().replace(/\s+/g, "_").replace(/[̀-ͯ]/g, "");
  const direto = s as TipoAmbiente;
  if (TIPOS_VALIDOS.has(direto)) return direto;
  // aliases comuns escritos por humano
  if (/RESERV/.test(s)) return "RESERVATORIO";
  if (/PISCINA/.test(s)) return "PISCINA";
  if (/CAIXA/.test(s)) return "CAIXA_DAGUA";
  if (/CAMARA|FRIGOR/.test(s)) return "CAMARA_FRIGORIFICA";
  if (/VARANDA|SACADA/.test(s)) return "VARANDA";
  if (/COBERT/.test(s)) return "LAJE_COBERTURA";
  if (/BOX/.test(s)) return "BOX_CHUVEIRO";
  if (/SECA/.test(s)) return "AREA_SECA";
  if (/MOLHAD|BANHEIRO/.test(s)) return "AREA_MOLHADA";
  return null;
}

export interface ResultadoPlanilha {
  ambientes: AmbienteEntrada[];
  abas: string[];
  linhasLidas: number;
  avisos: string[];
}

/** Verifica se o buffer é UTF-8 válido (com bytes multibyte). Evita mojibake em CSV. */
function ehUtf8(buf: Buffer): boolean {
  // BOM UTF-8
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return true;
  let temMulti = false;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b < 0x80) continue;
    let n = 0;
    if (b >= 0xc0 && b <= 0xdf) n = 1;
    else if (b >= 0xe0 && b <= 0xef) n = 2;
    else if (b >= 0xf0 && b <= 0xf7) n = 3;
    else return false; // byte de continuação solto ou inválido
    for (let k = 0; k < n; k++) {
      const c = buf[++i];
      if (c === undefined || c < 0x80 || c > 0xbf) return false;
    }
    temMulti = true;
  }
  return temMulti;
}

export function parsePlanilha(buffer: Buffer | ArrayBuffer): ResultadoPlanilha {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  // CSV: SheetJS assume Windows-1252 por padrão. Se o arquivo é UTF-8, força 65001
  // pra não estragar acentos (que o classificador e o matcher de colunas dependem).
  const opts: XLSX.ParsingOptions = { type: "buffer" };
  if (ehUtf8(buf)) opts.codepage = 65001;
  const wb = XLSX.read(buf, opts);
  const avisos: string[] = [];
  const ambientes: AmbienteEntrada[] = [];
  let linhasLidas = 0;

  for (const nomeAba of wb.SheetNames) {
    const ws = wb.Sheets[nomeAba];
    const linhas: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
    if (linhas.length < 2) continue;

    // acha a linha de cabeçalho (primeira que tenha nome + area)
    let hdrIdx = -1;
    let cab: string[] = [];
    for (let i = 0; i < Math.min(linhas.length, 15); i++) {
      const c = linhas[i].map((x) => x?.toString() ?? "");
      if (acharColuna(c, "nome") >= 0 && acharColuna(c, "areaPiso") >= 0) {
        hdrIdx = i;
        cab = c;
        break;
      }
    }
    if (hdrIdx < 0) continue; // aba sem tabela reconhecível

    const iNome = acharColuna(cab, "nome");
    const iArea = acharColuna(cab, "areaPiso");
    const iPerim = acharColuna(cab, "perimetro");
    const iAlt = acharColuna(cab, "altura");
    const iBox = acharColuna(cab, "boxComprimento");
    const iRep = acharColuna(cab, "repeticao");
    const iTipo = acharColuna(cab, "tipo");

    for (let r = hdrIdx + 1; r < linhas.length; r++) {
      const row = linhas[r];
      const nome = (row[iNome] ?? "").toString().trim();
      const areaPiso = numero(row[iArea]);
      if (!nome && areaPiso <= 0) continue; // linha vazia
      // ignora linhas de total/subtotal
      if (/^(total|subtotal|valor final|soma)/i.test(nome)) continue;

      const tipoCol = iTipo >= 0 ? normalizarTipo(row[iTipo]) : null;
      const alt = iAlt >= 0 ? numero(row[iAlt]) : 0;
      ambientes.push({
        nome: nome || "(sem nome)",
        areaPiso,
        perimetro: iPerim >= 0 ? numero(row[iPerim]) : 0,
        altura: alt > 0 ? alt : undefined,
        boxComprimento: iBox >= 0 ? numero(row[iBox]) || undefined : undefined,
        repeticao: iRep >= 0 ? Math.max(1, Math.round(numero(row[iRep])) || 1) : 1,
        tipo: tipoCol ?? classificarNome(nome),
        origem: `Planilha · aba ${nomeAba}`,
      });
      linhasLidas++;
    }
  }

  if (ambientes.length === 0) {
    throw new Error("Nenhuma tabela reconhecida. A planilha precisa de uma linha de cabeçalho com pelo menos as colunas 'ambiente' e 'área'.");
  }

  return { ambientes, abas: wb.SheetNames, linhasLidas, avisos };
}
