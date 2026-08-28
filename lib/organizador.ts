import { cache } from "react";
import { consultaSegura, prisma } from "./prisma";
import { DEMO, DEMO_ORGANIZADOR } from "./demo";

export type DadosOrganizador = {
  id: string;
  nome: string;
  whatsapp: string;
  instagram: string | null;
  chavePix: string | null;
  tipoChavePix: string | null;
};

/**
 * Fase 1 tem um organizador só, mas tudo já passa por organizador_id — quando a
 * fase 4 abrir para vários, só esta função muda.
 */
export const organizadorPrincipal = cache(async (): Promise<DadosOrganizador | null> => {
  if (DEMO) return DEMO_ORGANIZADOR;

  return consultaSegura(
    () =>
      prisma.organizador.findFirst({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nome: true,
          whatsapp: true,
          instagram: true,
          chavePix: true,
          tipoChavePix: true,
        },
      }),
    null
  );
});
