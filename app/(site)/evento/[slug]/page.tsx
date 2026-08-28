import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CapaEvento } from "@/components/capa-evento";
import { Revela } from "@/components/revela";
import { Selo } from "@/components/ui/selo";
import { BotaoLink, classesBotao } from "@/components/ui/botao";
import { IconeAlerta, IconeSeta } from "@/components/icones";
import { detalheEvento, slugsPublicados } from "@/lib/consultas";
import {
  dataPorExtenso,
  distanciaLegivel,
  formataMoeda,
  dataCurta,
} from "@/lib/formatos";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await slugsPublicados()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dados = await detalheEvento(slug);
  if (!dados) return { title: "Prova não encontrada" };

  const { evento } = dados;
  return {
    title: evento.nome,
    description:
      evento.subtitulo ??
      `${evento.nome} em ${evento.cidade}/${evento.uf}, ${dataCurta(evento.dataEvento)}. Inscreva-se pelo MoveON.`,
  };
}

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dados = await detalheEvento(slug);
  if (!dados || dados.evento.status === "rascunho") notFound();

  const { evento, modalidades, lote, proximo, vagas, estado } = dados;
  const inscricoesAbertas = estado.aberto;

  return (
    <div className="pb-28 md:pb-0">
      {/* Capa */}
      <section className="sobre-escuro raias bg-asfalto text-papel">
        <div className="pagina grid gap-10 py-12 md:grid-cols-[1fr_280px] md:items-center md:py-16">
          <div>
            <p className="rotulo rotulo-marcado text-papel/50">
              {evento.cidade} · {evento.uf}
            </p>
            <h1 className="mt-4 text-2xl md:text-3xl">{evento.nome}</h1>
            {evento.subtitulo && (
              <p className="mt-4 max-w-xl text-lg text-papel/75">{evento.subtitulo}</p>
            )}

            <dl className="mt-8 grid gap-4 border-t border-papel/15 pt-6 sm:grid-cols-2">
              <div>
                <dt className="rotulo text-papel/50">Data</dt>
                <dd className="dados mt-1 text-sm first-letter:uppercase">
                  {dataPorExtenso(evento.dataEvento)}
                </dd>
              </div>
              <div>
                <dt className="rotulo text-papel/50">Local</dt>
                <dd className="mt-1 text-sm">
                  {evento.localNome}
                  {evento.endereco && (
                    <span className="block text-papel/60">{evento.endereco}</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-papel/15 bg-white/5">
            <div className="perfuracao" aria-hidden />
            <CapaEvento
              url={evento.imagemCapaUrl}
              nome={evento.nome}
              prioridade
              sizes="(max-width: 767px) 100vw, 280px"
              className="aspect-16/10 md:aspect-4/5"
            />
          </div>
        </div>

        <div className="fita" aria-hidden />
      </section>

      {/* Conteúdo + preço */}
      <div className="pagina grid gap-12 py-12 md:grid-cols-[1fr_320px] md:py-16">
        <aside className="md:col-start-2 md:row-start-1">
          <div className="md:sticky md:top-[calc(var(--altura-cabecalho)+24px)]">
            <BlocoPreco
              aberto={inscricoesAbertas}
              motivo={inscricoesAbertas ? null : estado.texto}
              lote={lote}
              proximo={proximo}
              vagas={vagas}
              slug={evento.slug}
            />

            {evento.regulamentoUrl && (
              <a
                href={evento.regulamentoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="acao mt-4 flex min-h-12 items-center justify-between gap-3 border border-asfalto/20 px-4 text-sm font-medium hover:border-asfalto hover:bg-asfalto/5"
              >
                Ler o regulamento
                <IconeSeta className="size-4 text-azul" />
              </a>
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-12 md:col-start-1 md:row-start-1">
          <section>
            <h2 className="rotulo rotulo-marcado text-traco">Modalidades</h2>
            <Revela seletor="li">
            <ul className="mt-4 border-t border-asfalto/15">
              {modalidades.map((modalidade) => (
                <li
                  key={modalidade.id}
                  className="flex items-baseline justify-between gap-4 border-b border-asfalto/15 py-4"
                >
                  <div>
                    <p className="font-display text-lg font-extrabold [font-stretch:110%]">
                      {modalidade.nome}
                    </p>
                    <p className="mt-1 text-sm text-traco empty:hidden">
                      {detalheModalidade(modalidade.nome, modalidade.distanciaKm, modalidade.idadeMinima)}
                    </p>
                  </div>

                  {modalidade.vagas != null && (
                    <p className="dados shrink-0 text-right text-sm text-traco">
                      {modalidade.vagas > 0 ? (
                        <>
                          {modalidade.vagas}{" "}
                          <span className="text-xs">
                            {modalidade.vagas === 1 ? "vaga" : "vagas"}
                          </span>
                        </>
                      ) : (
                        <Selo tom="neutro">Esgotada</Selo>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            </Revela>
          </section>

          <Bloco titulo="Sobre a prova" texto={evento.descricao} />
          <Bloco titulo="Percurso" texto={evento.percurso} />
          <Bloco titulo="O que vem no kit" texto={evento.kit} />

          {(evento.horarioLargada || evento.retiradaKit) && (
            <section>
              <h2 className="rotulo rotulo-marcado text-traco">Horários</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {evento.horarioLargada && (
                  <div className="border-l border-azul pl-4">
                    <dt className="text-sm font-semibold">Largada</dt>
                    <dd className="dados mt-1 text-sm text-traco">{evento.horarioLargada}</dd>
                  </div>
                )}
                {evento.retiradaKit && (
                  <div className="border-l border-azul pl-4">
                    <dt className="text-sm font-semibold">Retirada do kit</dt>
                    <dd className="dados mt-1 text-sm text-traco">{evento.retiradaKit}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>

      {/* Barra fixa no celular */}
      {inscricoesAbertas && lote && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-papel md:hidden">
          <div className="fita" aria-hidden />
          <div className="p-3">
          <BotaoLink
            href={`/evento/${evento.slug}/inscricao`}
            tamanho="grande"
            className="w-full"
          >
            Fazer inscrição — {formataMoeda(lote.precoCentavos)}
          </BotaoLink>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * O nome da modalidade quase sempre já traz a distância ("10 km"). Repetir logo
 * abaixo é ruído — só mostramos a distância quando o nome não a contém.
 */
function detalheModalidade(
  nome: string,
  distanciaKm: unknown,
  idadeMinima: number
): string {
  const distancia = distanciaLegivel(distanciaKm);
  const numero = String(Number(distanciaKm));
  const repetida = distancia !== "" && nome.replace(",", ".").includes(numero);

  return [
    repetida ? null : distancia || null,
    idadeMinima > 0 ? `a partir de ${idadeMinima} anos` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Bloco({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto?.trim()) return null;
  return (
    <section>
      <h2 className="rotulo text-traco">{titulo}</h2>
      <div className="mt-4 flex max-w-prose flex-col gap-3 text-base">
        {texto.split(/\n{2,}/).map((paragrafo, indice) => (
          <p key={indice}>{paragrafo}</p>
        ))}
      </div>
    </section>
  );
}

function BlocoPreco({
  aberto,
  motivo,
  lote,
  proximo,
  vagas,
  slug,
}: {
  aberto: boolean;
  motivo: string | null;
  lote: { nome: string; precoCentavos: number; fimEm: Date | null } | null;
  proximo: { nome: string; precoCentavos: number } | null;
  vagas: number | null;
  slug: string;
}) {
  if (!aberto || !lote) {
    return (
      <div className="border border-asfalto/20 bg-white">
        <div className="perfuracao" aria-hidden />
        <div className="p-5">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold [font-stretch:110%]">
            <IconeAlerta className="size-5 text-traco" />
            {motivo ?? "Inscrições encerradas"}
          </p>
          <p className="mt-2 text-sm text-traco">
            Fale com a organização no WhatsApp para saber sobre a próxima prova.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-asfalto/20 bg-white">
      <div className="perfuracao" aria-hidden />
      <div className="p-5">
        <p className="rotulo rotulo-marcado text-traco">{lote.nome}</p>
        <p className="numeral numeral-veloz mt-3 text-2xl text-azul">
          {formataMoeda(lote.precoCentavos)}
        </p>

        <ul className="mt-4 flex flex-col gap-2 text-sm text-traco">
          {lote.fimEm && (
            <li className="dados">Este lote vale até {dataCurta(lote.fimEm)}</li>
          )}
          {proximo && (
            <li className="dados">
              Depois passa para {formataMoeda(proximo.precoCentavos)}
            </li>
          )}
          {vagas != null && (
            <li className="dados">
              {vagas} {vagas === 1 ? "vaga restante" : "vagas restantes"}
            </li>
          )}
        </ul>

        {vagas != null && vagas <= 20 && (
          <p className="mt-4">
            <Selo>{vagas === 0 ? "Esgotado" : `Últimas ${vagas} vagas`}</Selo>
          </p>
        )}

        <Link
          href={`/evento/${slug}/inscricao`}
          className={`${classesBotao("avanco", "grande")} mt-5 hidden w-full md:inline-flex`}
        >
          Fazer inscrição
        </Link>
      </div>
    </div>
  );
}
