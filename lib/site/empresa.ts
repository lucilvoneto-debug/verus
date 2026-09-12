/** Dados públicos da Verus usados na landing, no JSON-LD e nos links de WhatsApp. */
export const EMPRESA = {
  nome: "Verus Impermeabilizações",
  slogan: "Impermeabilização com garantia em Maceió e região",
  telefone: "5582991669449",
  telefoneFormatado: "(82) 99166-9449",
  email: "verusimpermeabilizacoes@gmail.com",
  cidade: "Maceió",
  uf: "AL",
  areas: ["Maceió", "Marechal Deodoro", "Rio Largo"],
  horario: "Seg–Sex 07:00–18:00 · Sáb 07:00–12:00",
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://verus.vercel.app",
};

export const SERVICOS = [
  { titulo: "Lajes e coberturas", desc: "Manta asfáltica, poliureia e membranas acrílicas. Fim das infiltrações no teto." },
  { titulo: "Piscinas e reservatórios", desc: "Sistemas cimentícios e poliuretano para caixas d'água, cisternas e piscinas." },
  { titulo: "Subsolos e garagens", desc: "Tratamento de umidade ascendente, juntas e cortinas de contenção." },
  { titulo: "Banheiros, varandas e sacadas", desc: "Áreas molhadas com impermeabilização antes do piso — sem quebrar depois." },
  { titulo: "Fachadas e muros", desc: "Hidrofugantes e selagem de fissuras contra chuva de vento." },
  { titulo: "Condomínios e obras", desc: "Contrato com cronograma, ART e laudo técnico. Atendemos construtoras e síndicos." },
];
