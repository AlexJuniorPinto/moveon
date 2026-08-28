export const entradaAdmin =
  "acao w-full min-h-11 rounded-[4px] border border-asfalto/25 bg-white px-3 text-sm hover:border-asfalto/45 focus:border-azul focus:outline-none";

export function CampoAdmin({
  nome,
  rotulo,
  tipo = "text",
  valor,
  obrigatorio = false,
  dica,
  placeholder,
  className = "",
  ...resto
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  valor?: string | number | null;
  obrigatorio?: boolean;
  dica?: string;
  placeholder?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "defaultValue" | "className">) {
  return (
    <div className={className}>
      <label htmlFor={nome} className="flex items-baseline gap-2 text-sm font-semibold">
        {rotulo}
        {!obrigatorio && <span className="rotulo font-normal text-traco">opcional</span>}
      </label>
      {dica && <p className="mt-1 text-xs text-traco">{dica}</p>}
      <input
        id={nome}
        name={nome}
        type={tipo}
        required={obrigatorio}
        placeholder={placeholder}
        defaultValue={valor ?? ""}
        className={`${entradaAdmin} mt-2`}
        {...resto}
      />
    </div>
  );
}

export function AreaAdmin({
  nome,
  rotulo,
  valor,
  linhas = 4,
  dica,
  className = "",
}: {
  nome: string;
  rotulo: string;
  valor?: string | null;
  linhas?: number;
  dica?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={nome} className="flex items-baseline gap-2 text-sm font-semibold">
        {rotulo}
        <span className="rotulo font-normal text-traco">opcional</span>
      </label>
      {dica && <p className="mt-1 text-xs text-traco">{dica}</p>}
      <textarea
        id={nome}
        name={nome}
        rows={linhas}
        defaultValue={valor ?? ""}
        className={`${entradaAdmin} mt-2 min-h-24 py-2 leading-relaxed`}
      />
    </div>
  );
}

export function Marcador({
  nome,
  rotulo,
  marcado = false,
  dica,
}: {
  nome: string;
  rotulo: string;
  marcado?: boolean;
  dica?: string;
}) {
  return (
    <label className="acao flex min-h-11 cursor-pointer items-center gap-3 rounded-[4px] border border-asfalto/25 bg-white px-3 text-sm hover:border-asfalto/45">
      <input
        type="checkbox"
        name={nome}
        defaultChecked={marcado}
        className="size-4 shrink-0 accent-azul"
      />
      <span>
        {rotulo}
        {dica && <span className="block text-xs text-traco">{dica}</span>}
      </span>
    </label>
  );
}

export function Painel({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-asfalto/15 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-asfalto/15 px-5 py-4">
        <div>
          <h2 className="font-display text-base font-extrabold [font-stretch:110%]">{titulo}</h2>
          {descricao && <p className="mt-1 text-xs text-traco">{descricao}</p>}
        </div>
        {acao}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

const CORES_STATUS: Record<string, string> = {
  pendente: "bg-papel-sombra text-asfalto",
  aguardando_confirmacao: "bg-amarelo text-asfalto",
  confirmada: "bg-verde text-asfalto",
  cancelada: "bg-asfalto/10 text-traco line-through",
  rascunho: "bg-papel-sombra text-traco",
  publicado: "bg-azul text-white",
  encerrado: "bg-asfalto text-papel",
  cancelado: "bg-asfalto/10 text-traco",
};

export function Etiqueta({ status, rotulo }: { status: string; rotulo: string }) {
  return (
    <span
      className={`rotulo inline-flex items-center px-2 py-1 font-medium ${
        CORES_STATUS[status] ?? "bg-papel-sombra text-asfalto"
      }`}
    >
      {rotulo}
    </span>
  );
}
