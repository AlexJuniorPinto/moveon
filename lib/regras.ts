import type { Evento, Lote, Modalidade } from "@prisma/client";

export const STATUS_INSCRICAO = {
  pendente: "Pendente",
  aguardando_confirmacao: "Aguardando confirmação",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
} as const;

export type StatusInscricao = keyof typeof STATUS_INSCRICAO;

/** Inscrições que ocupam vaga: tudo que não foi cancelado. */
export const STATUS_QUE_OCUPAM_VAGA: StatusInscricao[] = [
  "pendente",
  "aguardando_confirmacao",
  "confirmada",
];

/**
 * Lote vigente: o primeiro lote ativo cuja janela de datas contém agora e cujo
 * limite de vagas não foi atingido, na ordem definida pelo organizador.
 * Sempre resolvido no servidor — o cliente nunca escolhe o preço.
 */
export function loteVigente(
  lotes: Lote[],
  ocupadasPorLote: Record<string, number>,
  agora: Date = new Date()
): Lote | null {
  const candidatos = [...lotes].sort((a, b) => a.ordem - b.ordem);
  for (const lote of candidatos) {
    if (!lote.ativo) continue;
    if (lote.inicioEm && agora < lote.inicioEm) continue;
    if (lote.fimEm && agora > lote.fimEm) continue;
    if (lote.limiteVagas != null && (ocupadasPorLote[lote.id] ?? 0) >= lote.limiteVagas) continue;
    return lote;
  }
  return null;
}

export function proximoLote(lotes: Lote[], vigente: Lote | null): Lote | null {
  if (!vigente) return null;
  return (
    [...lotes]
      .sort((a, b) => a.ordem - b.ordem)
      .find((l) => l.ativo && l.ordem > vigente.ordem) ?? null
  );
}

export function vagasRestantes(limite: number | null, ocupadas: number): number | null {
  if (limite == null) return null;
  return Math.max(0, limite - ocupadas);
}

export type EstadoInscricoes =
  | { aberto: true }
  | { aberto: false; motivo: string; texto: string };

export function estadoInscricoes(
  evento: Pick<
    Evento,
    "status" | "inscricoesAbremEm" | "inscricoesFechamEm" | "limiteVagas" | "dataEvento"
  >,
  ocupadas: number,
  temLoteVigente: boolean,
  agora: Date = new Date()
): EstadoInscricoes {
  if (evento.status === "cancelado")
    return { aberto: false, motivo: "cancelado", texto: "Prova cancelada" };
  if (evento.status === "encerrado")
    return { aberto: false, motivo: "encerrado", texto: "Inscrições encerradas" };
  if (evento.status !== "publicado")
    return { aberto: false, motivo: "nao_publicado", texto: "Inscrições ainda não abriram" };
  if (evento.inscricoesAbremEm && agora < evento.inscricoesAbremEm)
    return { aberto: false, motivo: "nao_abriu", texto: "Inscrições ainda não abriram" };
  if (evento.inscricoesFechamEm && agora > evento.inscricoesFechamEm)
    return { aberto: false, motivo: "prazo_encerrado", texto: "Inscrições encerradas" };
  if (agora > evento.dataEvento)
    return { aberto: false, motivo: "prova_realizada", texto: "Prova já realizada" };
  if (evento.limiteVagas != null && ocupadas >= evento.limiteVagas)
    return { aberto: false, motivo: "esgotado", texto: "Esgotado" };
  if (!temLoteVigente)
    return { aberto: false, motivo: "sem_lote", texto: "Inscrições encerradas" };
  return { aberto: true };
}

export function modalidadeDisponivel(
  modalidade: Pick<Modalidade, "limiteVagas">,
  ocupadas: number
): boolean {
  return modalidade.limiteVagas == null || ocupadas < modalidade.limiteVagas;
}

/** "5 km · 10 km · Caminhada 3 km" */
export function resumoModalidades(modalidades: Pick<Modalidade, "nome" | "ordem">[]): string {
  return [...modalidades]
    .sort((a, b) => a.ordem - b.ordem)
    .map((m) => m.nome)
    .join(" · ");
}

/** O numeral gigante do card: a maior distância do evento. */
export function maiorDistancia(
  modalidades: Pick<Modalidade, "distanciaKm">[]
): number | null {
  const valores = modalidades
    .map((m) => Number(m.distanciaKm))
    .filter((n) => Number.isFinite(n) && n > 0);
  return valores.length ? Math.max(...valores) : null;
}

export type Selo = { texto: string; tom: "urgencia" | "prazo" } | null;

/** Um selo por card, no máximo. Vaga é mais urgente que prazo de lote. */
export function seloDoEvento(
  vagas: number | null,
  lote: Lote | null,
  agora: Date = new Date()
): Selo {
  if (vagas != null && vagas === 0) return { texto: "Esgotado", tom: "urgencia" };
  if (vagas != null && vagas <= 20) return { texto: `Últimas ${vagas} vagas`, tom: "urgencia" };
  if (lote?.fimEm) {
    const dias = Math.ceil((lote.fimEm.getTime() - agora.getTime()) / 86_400_000);
    if (dias > 0 && dias <= 7)
      return { texto: dias === 1 ? "Lote vira amanhã" : `Lote vira em ${dias} dias`, tom: "prazo" };
  }
  return null;
}

/** MV-2026-CFO-0087 */
export function formataNumeroInscricao(ano: number, sigla: string, sequencial: number): string {
  return `MV-${ano}-${sigla.toUpperCase()}-${String(sequencial).padStart(4, "0")}`;
}

export function mensagemWhatsapp(dados: {
  nomeEvento: string;
  numeroInscricao: string;
  nomeCompleto: string;
  modalidade: string;
  tamanhoCamisa: string;
  valor: string;
}): string {
  return (
    `Olá! Acabei de me inscrever na ${dados.nomeEvento}.\n\n` +
    `Número de inscrição: ${dados.numeroInscricao}\n` +
    `Nome: ${dados.nomeCompleto}\n` +
    `Modalidade: ${dados.modalidade}\n` +
    `Camisa: ${dados.tamanhoCamisa}\n` +
    `Valor: R$ ${dados.valor}\n\n` +
    `Pode me enviar o Pix para finalizar?`
  );
}

export function linkWhatsapp(whatsappE164: string, mensagem: string): string {
  const numero = whatsappE164.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
