/**
 * Rate limit em memória: 5 inscrições por IP a cada 10 minutos.
 * Suficiente para o cenário da fase 1 (uma instância num VPS). Ao escalar para
 * várias instâncias, trocar o Map por Redis mantendo a mesma assinatura.
 */
type Janela = { contagem: number; expiraEm: number };

const janelas = new Map<string, Janela>();

export function dentroDoLimite(chave: string, limite = 5, janelaMs = 10 * 60_000): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);

  if (!atual || agora > atual.expiraEm) {
    janelas.set(chave, { contagem: 1, expiraEm: agora + janelaMs });
    if (janelas.size > 5_000) limpaExpiradas(agora);
    return true;
  }

  if (atual.contagem >= limite) return false;
  atual.contagem++;
  return true;
}

function limpaExpiradas(agora: number) {
  for (const [chave, janela] of janelas) {
    if (agora > janela.expiraEm) janelas.delete(chave);
  }
}

export function ipDaRequisicao(headers: Headers): string {
  const encaminhado = headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "desconhecido";
}
