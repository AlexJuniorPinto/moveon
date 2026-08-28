import type { Prisma } from "@prisma/client";

export type FiltroInscritos = {
  status?: string;
  modalidade?: string;
  lote?: string;
  q?: string;
};

/**
 * Mesmo filtro usado na tabela do painel e na exportação CSV — o organizador
 * baixa exatamente o que está vendo na tela.
 */
export function montaFiltro(
  eventoId: string,
  filtros: FiltroInscritos
): Prisma.InscricaoWhereInput {
  const where: Prisma.InscricaoWhereInput = { eventoId };

  if (filtros.status) where.status = filtros.status;
  if (filtros.modalidade) where.modalidadeId = filtros.modalidade;
  if (filtros.lote) where.loteId = filtros.lote;

  const termo = (filtros.q ?? "").trim();
  if (termo) {
    const digitos = termo.replace(/\D/g, "");
    where.OR = [
      { nomeCompleto: { contains: termo, mode: "insensitive" } },
      ...(digitos.length >= 3
        ? [{ cpf: { contains: digitos } }, { telefone: { contains: digitos } }]
        : []),
    ];
  }

  return where;
}
