import Image from "next/image";

type Props = {
  url: string | null;
  nome: string;
  prioridade?: boolean;
  className?: string;
  sizes?: string;
};

/**
 * Enquanto o organizador não sobe a foto real da prova, o espaço fica reservado
 * com o nome do evento — nada de foto de banco de imagem.
 */
export function CapaEvento({ url, nome, prioridade = false, className = "", sizes }: Props) {
  if (url) {
    return (
      <div className={`relative overflow-hidden bg-papel-sombra ${className}`}>
        <Image
          src={url}
          alt={`Capa da ${nome}`}
          fill
          priority={prioridade}
          sizes={sizes ?? "(max-width: 767px) 82vw, 360px"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col gap-2 overflow-hidden bg-papel-sombra p-4 ${className}`}
      role="img"
      aria-label={`${nome} — foto ainda não publicada`}
    >
      <span aria-hidden className="rotulo text-traco">
        Foto em breve
      </span>
      <span
        aria-hidden
        className="font-display text-lg leading-tight font-extrabold text-traco/65 [font-stretch:125%]"
      >
        {nome}
      </span>
    </div>
  );
}
