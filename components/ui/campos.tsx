import { IconeAlerta } from "@/components/icones";

export const classesEntrada =
  "acao w-full min-h-12 rounded-[4px] border bg-white px-3 text-base placeholder:text-traco/70 focus:outline-none";

export function entrada(temErro: boolean) {
  return `${classesEntrada} ${
    temErro
      ? "border-erro focus:border-erro"
      : "border-asfalto/25 hover:border-asfalto/45 focus:border-azul"
  }`;
}

export function Campo({
  id,
  rotulo,
  erro,
  dica,
  opcional = false,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string | null;
  dica?: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-semibold">
        {rotulo}
        {opcional && <span className="rotulo font-normal text-traco">opcional</span>}
      </label>

      {dica && (
        <p id={`${id}-dica`} className="mt-1 text-xs text-traco">
          {dica}
        </p>
      )}

      <div className="mt-2">{children}</div>

      {erro && (
        <p
          id={`${id}-erro`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-sm text-erro"
        >
          <IconeAlerta className="mt-0.5 size-4" />
          {erro}
        </p>
      )}
    </div>
  );
}

export function Grupo({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-asfalto/15 pt-8">
      <legend className="sr-only">{titulo}</legend>
      <p className="rotulo text-traco" aria-hidden>
        {titulo}
      </p>
      {descricao && <p className="mt-2 max-w-md text-sm text-traco">{descricao}</p>}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}
