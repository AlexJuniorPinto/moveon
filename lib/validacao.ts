/** Validações compartilhadas entre cliente e servidor. Sem dependências. */

export function apenasDigitos(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

export function validaCpf(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 000.000.000-00, 111... etc.

  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(cpf[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71,
  73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function validaTelefone(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 11) return false;
  if (!DDDS_VALIDOS.has(Number(d.slice(0, 2)))) return false;
  return d[2] === "9"; // celular brasileiro
}

/** (37) 99999-9999 -> +5537999999999 */
export function paraE164(valor: string): string {
  const d = apenasDigitos(valor);
  if (d.startsWith("55") && d.length >= 12) return `+${d}`;
  return `+55${d}`;
}

export function nomeCompletoValido(valor: string): boolean {
  const limpo = (valor ?? "").trim().replace(/\s+/g, " ");
  return limpo.length >= 5 && limpo.split(" ").filter((p) => p.length >= 2).length >= 2;
}

export function capitalizaNome(valor: string): string {
  const minusculas = new Set(["de", "da", "do", "das", "dos", "e"]);
  return (valor ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) =>
      i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(" ");
}

/** Idade completa na data do evento — é ela que libera a modalidade. */
export function idadeNaData(nascimento: Date, referencia: Date): number {
  let idade = referencia.getFullYear() - nascimento.getFullYear();
  const mes = referencia.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < nascimento.getDate())) idade--;
  return idade;
}

/**
 * Categoria de premiação: idade completada até 31/12 do ano do evento,
 * padrão das corridas de rua brasileiras.
 */
export function categoriaEtaria(nascimento: Date, dataEvento: Date): string {
  const idade = dataEvento.getFullYear() - nascimento.getFullYear();
  if (idade <= 19) return "até 19";
  if (idade <= 29) return "20-29";
  if (idade <= 39) return "30-39";
  if (idade <= 49) return "40-49";
  if (idade <= 59) return "50-59";
  if (idade <= 69) return "60-69";
  return "70+";
}

export const TAMANHOS_CAMISA = ["PP", "P", "M", "G", "GG", "XGG"] as const;
export const SEXOS = [
  { valor: "masculino", rotulo: "Masculino" },
  { valor: "feminino", rotulo: "Feminino" },
  { valor: "nao_informar", rotulo: "Prefiro não informar" },
] as const;
export const MODELOS_CAMISA = [
  { valor: "masculina", rotulo: "Masculina" },
  { valor: "baby_look", rotulo: "Baby look" },
] as const;
