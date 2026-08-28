/** Aviso de urgência. Amarelo cone, e nunca ao lado do verde no mesmo bloco. */
export function Selo({ children, tom = "urgencia" }: { children: React.ReactNode; tom?: "urgencia" | "prazo" | "neutro" }) {
  const cores = {
    urgencia: "bg-amarelo text-asfalto",
    prazo: "bg-asfalto text-papel",
    neutro: "bg-papel-sombra text-asfalto",
  }[tom];

  return <span className={`rotulo inline-flex items-center px-2 py-1 font-medium ${cores}`}>{children}</span>;
}
