import Link from "next/link";
import { CapaEvento } from "@/components/capa-evento";
import { Selo } from "@/components/ui/selo";
import { etiquetaData, formataMoeda } from "@/lib/formatos";
import type { CartaoEvento } from "@/lib/consultas";

/**
 * O card é um número de peito: furos no topo, o numeral da maior distância em
 * numerais tabulares e a faixa inferior com a data — como a tarja de patrocínio.
 */
export function CardEvento({ evento, prioridade = false }: { evento: CartaoEvento; prioridade?: boolean }) {
  const data = etiquetaData(evento.dataEvento);
  const esgotado = !evento.aberto;

  return (
    <Link
      href={`/evento/${evento.slug}`}
      className="acao group flex flex-col border border-asfalto/15 bg-white hover:border-asfalto focus-visible:border-asfalto"
      aria-label={`${evento.nome}, ${evento.cidade} ${evento.uf}, ${data.diaSemana} ${data.dia} ${data.mes}`}
    >
      <div className="perfuracao" aria-hidden />

      <CapaEvento
        url={evento.imagemCapaUrl}
        nome={evento.nome}
        prioridade={prioridade}
        className={`aspect-4/5 ${esgotado ? "opacity-55 grayscale" : ""}`}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-baseline gap-1 text-azul">
            <span className="numeral text-3xl">
              {evento.maiorDistancia ?? "—"}
            </span>
            {evento.maiorDistancia != null && (
              <span className="rotulo pb-1 text-azul/70">km</span>
            )}
          </p>
          {evento.selo && <Selo tom={evento.selo.tom}>{evento.selo.texto}</Selo>}
        </div>

        <div>
          <h3 className="text-lg">{evento.nome}</h3>
          <p className="mt-1 text-sm text-traco">
            {evento.cidade} · {evento.uf}
          </p>
        </div>

        <p className="dados mt-auto text-xs text-traco">{evento.resumoModalidades}</p>
      </div>

      <div className="acao flex items-end justify-between gap-3 bg-asfalto px-4 py-3 text-papel group-hover:bg-azul group-focus-visible:bg-azul">
        <p className="dados text-sm leading-tight">
          <span className="block text-papel/60">{data.diaSemana}</span>
          <span className="text-base font-medium">
            {data.dia} {data.mes}
          </span>
        </p>

        <p className="text-right leading-tight">
          {evento.precoCentavos != null && !esgotado ? (
            <>
              <span className="rotulo block text-papel/60">a partir de</span>
              <span className="dados text-base font-medium">
                {formataMoeda(evento.precoCentavos)}
              </span>
            </>
          ) : (
            <span className="rotulo text-papel/70">ver prova</span>
          )}
        </p>
      </div>
    </Link>
  );
}
