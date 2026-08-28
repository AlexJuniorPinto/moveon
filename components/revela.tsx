"use client";

import { useEffect, useRef } from "react";

/**
 * Revela os filhos quando o bloco entra na tela, em cascata.
 *
 * IntersectionObserver + CSS, sem biblioteca de animação. Revela uma vez só:
 * reanimar a cada passagem cansa e atrapalha quem volta na página.
 */
export function Revela({
  children,
  className = "",
  atrasoInicial = 0,
  seletor = ":scope > *",
}: {
  children: React.ReactNode;
  className?: string;
  atrasoInicial?: number;
  seletor?: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = alvo.current;
    if (!raiz) return;

    const itens = Array.from(raiz.querySelectorAll<HTMLElement>(seletor));
    itens.forEach((item, indice) => {
      item.classList.add("revela");
      item.style.setProperty("--atraso", String(indice + atrasoInicial));
    });

    const mostrar = () => itens.forEach((item) => item.setAttribute("data-revelado", "sim"));

    // Se já está visível na carga, revela sem esperar o observador.
    if (raiz.getBoundingClientRect().top < window.innerHeight) {
      requestAnimationFrame(mostrar);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          mostrar();
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );

    observador.observe(raiz);
    return () => observador.disconnect();
  }, [seletor, atrasoInicial]);

  return (
    <div ref={alvo} className={className}>
      {children}
    </div>
  );
}
