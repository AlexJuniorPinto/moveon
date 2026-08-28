import Link from "next/link";

/**
 * A marca segue o mesmo idioma do peitoral: "MOVE" impresso no papel e "ON"
 * dentro da tarja, como o bloco do patrocinador no rodapé do número.
 */
export function Marca({
  href = "/",
  tom = "claro",
}: {
  href?: string | null;
  tom?: "claro" | "escuro";
}) {
  const corTexto = tom === "claro" ? "text-asfalto" : "text-papel";
  const tarja = tom === "claro" ? "bg-azul text-papel" : "bg-papel text-asfalto";

  const conteudo = (
    <span className="flex items-center">
      <span
        className={`font-display text-lg leading-none font-extrabold tracking-[-0.03em] [font-stretch:125%] ${corTexto}`}
      >
        MOVE
      </span>
      <span
        className={`ml-[3px] px-[5px] py-[3px] font-display text-lg leading-none font-extrabold tracking-[-0.02em] [font-stretch:125%] ${tarja}`}
      >
        ON
      </span>
    </span>
  );

  if (!href) return conteudo;

  return (
    <Link href={href} className="acao inline-flex items-center" aria-label="MoveON, página inicial">
      {conteudo}
    </Link>
  );
}
