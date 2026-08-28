import Link from "next/link";

type Variante = "avanco" | "estrutura" | "contorno" | "contorno-claro" | "texto";
type Tamanho = "normal" | "grande";

const variantes: Record<Variante, string> = {
  // Verde chegada é reservado para ações de avanço: inscrever e finalizar.
  avanco: "bg-verde text-asfalto hover:bg-verde-escuro border border-transparent",
  estrutura: "bg-azul text-white hover:bg-azul-escuro border border-transparent",
  contorno: "bg-transparent text-asfalto border border-asfalto/25 hover:border-asfalto hover:bg-asfalto/5",
  // Mesmo contorno, do outro lado do contraste: sobre a foto do hero.
  "contorno-claro":
    "bg-transparent text-papel border border-papel/35 hover:border-papel hover:bg-papel/12",
  texto: "bg-transparent text-azul border border-transparent hover:bg-azul/8 underline underline-offset-4 decoration-1",
};

const tamanhos: Record<Tamanho, string> = {
  normal: "min-h-12 px-5 text-sm",
  grande: "min-h-14 px-6 text-base",
};

const base =
  "acao inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold tracking-tight cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-inherit";

export function classesBotao(variante: Variante = "avanco", tamanho: Tamanho = "normal") {
  return `${base} ${variantes[variante]} ${tamanhos[tamanho]}`;
}

type Props = {
  variante?: Variante;
  tamanho?: Tamanho;
  className?: string;
  children: React.ReactNode;
};

export function Botao({
  variante = "avanco",
  tamanho = "normal",
  className = "",
  children,
  ...resto
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${classesBotao(variante, tamanho)} ${className}`} {...resto}>
      {children}
    </button>
  );
}

export function BotaoLink({
  href,
  variante = "avanco",
  tamanho = "normal",
  className = "",
  children,
  ...resto
}: Props & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={`${classesBotao(variante, tamanho)} ${className}`} {...resto}>
      {children}
    </Link>
  );
}
