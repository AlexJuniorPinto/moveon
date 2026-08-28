import { cache } from "react";
import type { Evento, Lote, Modalidade } from "@prisma/client";
import { consultaSegura, prisma } from "./prisma";
import { DEMO, DEMO_SLUGS, demoDetalhe, demoVitrine } from "./demo";
import {
  estadoInscricoes,
  loteVigente,
  maiorDistancia,
  proximoLote,
  resumoModalidades,
  seloDoEvento,
  STATUS_QUE_OCUPAM_VAGA,
  vagasRestantes,
  type EstadoInscricoes,
  type Selo,
} from "./regras";

type EventoCompleto = Evento & { modalidades: Modalidade[]; lotes: Lote[] };

export type CartaoEvento = {
  slug: string;
  nome: string;
  subtitulo: string | null;
  cidade: string;
  uf: string;
  dataEvento: Date;
  imagemCapaUrl: string | null;
  resumoModalidades: string;
  maiorDistancia: number | null;
  precoCentavos: number | null;
  vagas: number | null;
  selo: Selo;
  aberto: boolean;
};

export type DetalheEvento = {
  evento: EventoCompleto;
  modalidades: (Modalidade & { vagas: number | null; disponivel: boolean })[];
  lote: Lote | null;
  proximo: Lote | null;
  vagas: number | null;
  ocupadas: number;
  estado: EstadoInscricoes;
};

/** Ocupação por evento, por lote e por modalidade numa consulta só por eixo. */
async function contagens(eventoIds: string[]) {
  if (eventoIds.length === 0) {
    return { porEvento: {}, porLote: {}, porModalidade: {} } as const;
  }

  const filtro = {
    eventoId: { in: eventoIds },
    status: { in: STATUS_QUE_OCUPAM_VAGA },
  };

  const [porLoteBruto, porModalidadeBruto] = await Promise.all([
    prisma.inscricao.groupBy({ by: ["eventoId", "loteId"], where: filtro, _count: { _all: true } }),
    prisma.inscricao.groupBy({
      by: ["eventoId", "modalidadeId"],
      where: filtro,
      _count: { _all: true },
    }),
  ]);

  const porEvento: Record<string, number> = {};
  const porLote: Record<string, number> = {};
  const porModalidade: Record<string, number> = {};

  for (const linha of porLoteBruto) {
    porLote[linha.loteId] = linha._count._all;
    porEvento[linha.eventoId] = (porEvento[linha.eventoId] ?? 0) + linha._count._all;
  }
  for (const linha of porModalidadeBruto) {
    porModalidade[linha.modalidadeId] = linha._count._all;
  }

  return { porEvento, porLote, porModalidade } as const;
}

export const vitrine = cache(async (): Promise<CartaoEvento[]> => {
  if (DEMO) return demoVitrine();

  return consultaSegura(async () => {
    const agora = new Date();
    const eventos = await prisma.evento.findMany({
      where: { status: "publicado", deletedAt: null, dataEvento: { gte: agora } },
      orderBy: [{ destaque: "desc" }, { dataEvento: "asc" }],
      include: { modalidades: { orderBy: { ordem: "asc" } }, lotes: true },
      take: 24,
    });

    const { porEvento, porLote } = await contagens(eventos.map((e) => e.id));

    return eventos.map((evento) => {
      const ocupadas = porEvento[evento.id] ?? 0;
      const lote = loteVigente(evento.lotes, porLote, agora);
      const vagas = vagasRestantes(evento.limiteVagas, ocupadas);
      const estado = estadoInscricoes(evento, ocupadas, lote != null, agora);

      return {
        slug: evento.slug,
        nome: evento.nome,
        subtitulo: evento.subtitulo,
        cidade: evento.cidade,
        uf: evento.uf,
        dataEvento: evento.dataEvento,
        imagemCapaUrl: evento.imagemCapaUrl,
        resumoModalidades: resumoModalidades(evento.modalidades),
        maiorDistancia: maiorDistancia(evento.modalidades),
        precoCentavos: lote?.precoCentavos ?? null,
        vagas,
        selo: estado.aberto ? seloDoEvento(vagas, lote, agora) : { texto: estado.texto, tom: "urgencia" },
        aberto: estado.aberto,
      } satisfies CartaoEvento;
    });
  }, []);
});

export const detalheEvento = cache(async (slug: string): Promise<DetalheEvento | null> => {
  if (DEMO) return demoDetalhe(slug);

  return consultaSegura(async () => {
    const agora = new Date();
    const evento = await prisma.evento.findFirst({
      where: { slug, deletedAt: null },
      include: {
        modalidades: { orderBy: { ordem: "asc" } },
        lotes: { orderBy: { ordem: "asc" } },
      },
    });
    if (!evento) return null;

    const { porEvento, porLote, porModalidade } = await contagens([evento.id]);
    const ocupadas = porEvento[evento.id] ?? 0;
    const lote = loteVigente(evento.lotes, porLote, agora);

    return {
      evento,
      modalidades: evento.modalidades.map((m) => {
        const vagas = vagasRestantes(m.limiteVagas, porModalidade[m.id] ?? 0);
        return { ...m, vagas, disponivel: vagas == null || vagas > 0 };
      }),
      lote,
      proximo: proximoLote(evento.lotes, lote),
      vagas: vagasRestantes(evento.limiteVagas, ocupadas),
      ocupadas,
      estado: estadoInscricoes(evento, ocupadas, lote != null, agora),
    } satisfies DetalheEvento;
  }, null);
});

export const slugsPublicados = async (): Promise<string[]> => {
  if (DEMO) return DEMO_SLUGS;

  return consultaSegura(
    async () =>
      (
        await prisma.evento.findMany({
          where: { status: "publicado", deletedAt: null },
          select: { slug: true },
        })
      ).map((e) => e.slug),
    []
  );
};
