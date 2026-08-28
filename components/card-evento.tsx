import Link from "next/link";
import { CapaEvento } from "@/components/capa-evento";
import { Selo } from "@/components/ui/selo";
import { etiquetaData, formataMoeda } from "@/lib/formatos";
import type { CartaoEvento } from "@/lib/consultas";

/**
 * O card é um número de peito em movimento: furos no topo, a maior distância em
 * numerais tabulares inclinados e a faixa inferior com a data — que o ponteiro
 * preenche de azul da esquerda para a direita, como quem cruza a linha.
 */
export function CardEvento({
  evento,
  prioridade = false,
}: {
  evento: CartaoEvento;
  prioridade?: boolean;
}) {
  const data = etiquetaData(evento.dataEvento);
  const esgotado = !evento.aberto;

  return (
    <Link
      href={`/evento/${evento.slug}`}
      className="acao group flex flex-col border border-asfalto/15 bg-white hover:border-asfalto focus-visible:border-asfalto"
      aria-label={`${evento.nome}, ${evento.cidade} ${evento.uf}, ${data.diaSemana} ${data.dia} ${data.mes}`}
    >
      <div className="perfuracao" aria-hidden />

      <div className="overflow-hidden">
        <CapaEvento
          url={evento.imagemCapaUrl}
          nome={evento.nome}
          prioridade={prioridade}
          className={`aspect-4/5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
            esgotado ? "opacity-55 grayscale" : ""
          }`}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-baseline gap-1.5 text-azul">
            <span className="numeral numeral-veloz text-3xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
              {evento.maiorDistancia ?? "—"}
            </span>
            {evento.maiorDistancia != null && (
              <span className="rotulo pb-1.5 font-medium text-verde-escuro">km</span>
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

      <div className="relative overflow-hidden bg-asfalto px-4 py-3 text-papel">
        <span
          aria-hidden
          className="absolute inset-0 origin-left scale-x-0 bg-azul transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
        />

        <span className="relative flex items-end justify-between gap-3">
          <span className="dados text-sm leading-tight">
            <span className="block text-papel/60">{data.diaSemana}</span>
            <span className="text-base font-medium">
              {data.dia} {data.mes}
            </span>
          </span>

          <span className="text-right leading-tight">
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
          </span>
        </span>
      </div>
    </Link>
  );
}
