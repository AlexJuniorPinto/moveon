"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import imagemHero from "@/hero.png";

/**
 * A imagem mantém a cena da corrida no plano de fundo. A luz do ponteiro é
 * feita com variáveis CSS para não disparar renderizações a cada movimento.
 */
export function HeroExperiencia({ children }: { children: React.ReactNode }) {
  const hero = useRef<HTMLElement>(null);
  const quadro = useRef<number | null>(null);
  const posicao = useRef({ x: 52, y: 42 });

  useEffect(() => {
    return () => {
      if (quadro.current) cancelAnimationFrame(quadro.current);
    };
  }, []);

  function atualizarLuz(evento: React.PointerEvent<HTMLElement>) {
    const area = evento.currentTarget.getBoundingClientRect();
    posicao.current = {
      x: ((evento.clientX - area.left) / area.width) * 100,
      y: ((evento.clientY - area.top) / area.height) * 100,
    };

    if (quadro.current) return;
    quadro.current = requestAnimationFrame(() => {
      hero.current?.style.setProperty("--luz-x", `${posicao.current.x}%`);
      hero.current?.style.setProperty("--luz-y", `${posicao.current.y}%`);
      quadro.current = null;
    });
  }

  function centralizarLuz() {
    hero.current?.style.setProperty("--luz-x", "52%");
    hero.current?.style.setProperty("--luz-y", "42%");
  }

  return (
    <section
      ref={hero}
      className="hero-moveon text-papel"
      onPointerMove={atualizarLuz}
      onPointerLeave={centralizarLuz}
    >
      <Image
        src={imagemHero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-moveon-imagem"
      />
      {children}
      <SilhuetasCorredores />
    </section>
  );
}

function SilhuetasCorredores() {
  return (
    <div className="corredores" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((indice) => (
        <svg
          key={indice}
          className="corredor"
          viewBox="0 0 100 110"
          style={
            {
              "--deslocamento": `${indice * 5}px`,
              "--escala": String(0.78 + indice * 0.06),
              "--opacidade": String(0.66 + indice * 0.07),
              "--atraso-corredor": `${indice * -220}ms`,
            } as React.CSSProperties
          }
        >
          <circle cx="63" cy="18" r="10" />
          <path d="M57 31 48 57 61 72 73 48 82 51 87 43 69 35Z" />
          <path d="m53 55-24 14 5 8 27-10M58 69 37 94l8 7 27-25M65 70l18 22 8-6-17-28" />
        </svg>
      ))}
    </div>
  );
}
