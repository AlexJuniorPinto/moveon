import Link from "next/link";
import { Etiqueta } from "@/components/admin/campos";
import { classesBotao } from "@/components/ui/botao";
import { prisma } from "@/lib/prisma";
import { mudarStatusEvento } from "@/lib/acoes-admin";
import { dataCurta, formataMoeda } from "@/lib/formatos";
import { STATUS_QUE_OCUPAM_VAGA } from "@/lib/regras";

export const dynamic = "force-dynamic";

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export default async function ListaEventos() {
  const eventos = await prisma.evento.findMany({
    where: { deletedAt: null },
    orderBy: [{ dataEvento: "asc" }],
    include: {
      modalidades: { orderBy: { ordem: "asc" } },
      lotes: { orderBy: { ordem: "asc" } },
      _count: { select: { inscricoes: { where: { status: { in: STATUS_QUE_OCUPAM_VAGA } } } } },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo text-traco">Provas</p>
          <h1 className="mt-2 text-xl">
            {eventos.length} {eventos.length === 1 ? "prova cadastrada" : "provas cadastradas"}
          </h1>
        </div>
        <Link href="/admin/eventos/novo" className={classesBotao("estrutura")}>
          Criar prova
        </Link>
      </div>

      {eventos.length === 0 ? (
        <div className="border border-dashed border-asfalto/25 bg-white p-10 text-center">
          <p className="font-semibold">Nenhuma prova ainda.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-traco">
            A prova nasce como rascunho: você cadastra, adiciona modalidades e lotes, e só
            então publica.
          </p>
          <Link href="/admin/eventos/novo" className={`${classesBotao("estrutura")} mt-6`}>
            Criar prova
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {eventos.map((evento) => {
            const menorPreco = evento.lotes
              .filter((l) => l.ativo)
              .map((l) => l.precoCentavos)
              .sort((a, b) => a - b)[0];
            const incompleto = evento.modalidades.length === 0 || evento.lotes.length === 0;

            return (
              <li key={evento.id} className="border border-asfalto/15 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-lg font-extrabold [font-stretch:110%]">
                        {evento.nome}
                      </h2>
                      <Etiqueta
                        status={evento.status}
                        rotulo={ROTULO_STATUS[evento.status] ?? evento.status}
                      />
                    </div>

                    <p className="dados mt-2 text-sm text-traco">
                      {dataCurta(evento.dataEvento)} · {evento.cidade}/{evento.uf} ·{" "}
                      {evento._count.inscricoes} inscritos
                      {evento.limiteVagas != null && `/${evento.limiteVagas}`}
                      {menorPreco != null && ` · a partir de ${formataMoeda(menorPreco)}`}
                    </p>

                    <p className="mt-2 text-xs text-traco">
                      {evento.modalidades.length}{" "}
                      {evento.modalidades.length === 1 ? "modalidade" : "modalidades"} ·{" "}
                      {evento.lotes.length} {evento.lotes.length === 1 ? "lote" : "lotes"}
                      {incompleto && (
                        <span className="ml-2 text-erro">
                          Falta cadastrar {evento.modalidades.length === 0 ? "modalidade" : "lote"}{" "}
                          para poder publicar.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/eventos/${evento.id}/inscritos`}
                      className={classesBotao("contorno")}
                    >
                      Inscritos
                    </Link>
                    <Link href={`/admin/eventos/${evento.id}`} className={classesBotao("contorno")}>
                      Editar
                    </Link>

                    {evento.status === "publicado" ? (
                      <form action={mudarStatusEvento}>
                        <input type="hidden" name="id" value={evento.id} />
                        <input type="hidden" name="status" value="rascunho" />
                        <button type="submit" className={classesBotao("contorno")}>
                          Tirar do ar
                        </button>
                      </form>
                    ) : (
                      <form action={mudarStatusEvento}>
                        <input type="hidden" name="id" value={evento.id} />
                        <input type="hidden" name="status" value="publicado" />
                        <button
                          type="submit"
                          disabled={incompleto}
                          className={classesBotao("estrutura")}
                          title={
                            incompleto
                              ? "Cadastre ao menos uma modalidade e um lote antes de publicar."
                              : undefined
                          }
                        >
                          Publicar
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {evento.status === "publicado" && (
                  <p className="border-t border-asfalto/10 px-5 py-3 text-xs">
                    <a
                      href={`/evento/${evento.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="acao dados text-azul underline underline-offset-4"
                    >
                      /evento/{evento.slug} ↗
                    </a>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
