export const FUSO = "America/Sao_Paulo";

const semPonto = (s: string) => s.replace(/\./g, "");

export function formataMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** "60,00" — para compor a mensagem do WhatsApp sem o símbolo. */
export function valorSimples(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "sexta-feira, 12 de setembro de 2026" */
export function dataPorExtenso(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSO,
  });
}

/** "12 SET 2026" */
export function dataCurta(data: Date): string {
  const partes = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: FUSO,
  });
  return semPonto(partes).replace(/ de /g, " ").toUpperCase();
}

/** Etiqueta do card da vitrine: { diaSemana: "SEX", dia: "12", mes: "SET" } */
export function etiquetaData(data: Date): { diaSemana: string; dia: string; mes: string } {
  const fmt = (opcoes: Intl.DateTimeFormatOptions) =>
    semPonto(data.toLocaleDateString("pt-BR", { ...opcoes, timeZone: FUSO })).toUpperCase();
  return {
    diaSemana: fmt({ weekday: "short" }),
    dia: fmt({ day: "2-digit" }),
    mes: fmt({ month: "short" }),
  };
}

/** "12/09/2026 às 14:32" */
export function dataHora(data: Date): string {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  });
}

export function mascaraCpf(digitos: string): string {
  const d = digitos.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Nunca expor o CPF inteiro fora do painel: "•••.•••.•••-042" */
export function cpfMascaradoParaExibicao(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  return `•••.•••.••${d.slice(-3, -2)}-${d.slice(-2)}`;
}

/** "(37) 9••••-9999" — confirma o número sem expô-lo por inteiro. */
export function telefoneMascarado(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const nacional = d.startsWith("55") ? d.slice(2) : d;
  if (nacional.length !== 11) return "•••••";
  return `(${nacional.slice(0, 2)}) ${nacional[2]}••••-${nacional.slice(-4)}`;
}

export function mascaraTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** +5537999999999 -> (37) 99999-9999 */
export function telefoneLegivel(e164: string): string {
  const d = e164.replace(/\D/g, "");
  return mascaraTelefone(d.startsWith("55") ? d.slice(2) : d);
}

export function distanciaLegivel(km: unknown): string {
  const n = Number(km);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

/**
 * Data para o <input type="datetime-local">, sempre em America/Sao_Paulo — o
 * organizador digita o horário local da prova, não UTC.
 */
export function paraCampoDataHora(data: Date | null | undefined): string {
  if (!data) return "";
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(data);
  return partes.replace(" ", "T");
}

/** 6000 -> "60,00", para preencher o campo de preço do painel. */
export function paraCampoPreco(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}
