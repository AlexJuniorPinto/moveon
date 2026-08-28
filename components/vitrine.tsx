"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ATRITO = 0.93;
const VELOCIDADE_MINIMA = 0.4;
const TOLERANCIA_CLIQUE = 6;

/**
 * Posição de scroll em que o card fica alinhado, respeitando o
 * scroll-snap-align real (start no desktop, center no mobile).
 */
function destinoDoCard(trilho: HTMLElement, card: HTMLElement): number {
  const caixaTrilho = trilho.getBoundingClientRect();
  const caixaCard = card.getBoundingClientRect();
  const deslocamento = trilho.scrollLeft + (caixaCard.left - caixaTrilho.left);

  const alinhamento = getComputedStyle(card).scrollSnapAlign.split(" ")[0];
  if (alinhamento === "center") {
    return deslocamento + caixaCard.width / 2 - trilho.clientWidth / 2;
  }

  const recuo = Number.parseFloat(getComputedStyle(trilho).scrollPaddingLeft) || 0;
  return deslocamento - recuo;
}

function indiceMaisProximo(trilho: HTMLElement): number {
  const cards = [...trilho.children] as HTMLElement[];
  let melhor = 0;
  let menorDistancia = Number.POSITIVE_INFINITY;

  cards.forEach((card, indice) => {
    const distancia = Math.abs(destinoDoCard(trilho, card) - trilho.scrollLeft);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = indice;
    }
  });

  return melhor;
}

function prefereMenosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Vitrine horizontal.
 * - Toque: scroll nativo com scroll-snap do CSS. Nada é interceptado, então o
 *   momentum do sistema continua valendo.
 * - Mouse: arraste com inércia leve. O snap volta a valer quando a inércia
 *   termina, e é o próprio navegador que alinha o card.
 * - Roda do mouse: vira scroll horizontal, mas devolve o gesto para a página
 *   quando a vitrine chega ao fim — senão a página trava.
 */
export function Vitrine({
  children,
  rotulo = "Provas abertas",
}: {
  children: React.ReactNode;
  rotulo?: string;
}) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const arrasto = useRef({
    ativo: false,
    inicioX: 0,
    inicioScroll: 0,
    ultimoX: 0,
    ultimoT: 0,
    velocidade: 0,
  });
  const arrastou = useRef(false);
  const animacao = useRef<number | null>(null);

  const [progresso, setProgresso] = useState(0);
  const [proporcao, setProporcao] = useState(1);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const medir = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const rolavel = el.scrollWidth - el.clientWidth;
    setProporcao(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1);
    setProgresso(rolavel > 0 ? el.scrollLeft / rolavel : 0);
    setPodeVoltar(el.scrollLeft > 4);
    setPodeAvancar(rolavel > 4 && el.scrollLeft < rolavel - 4);
  }, []);

  useEffect(() => {
    medir();
    const el = trilhoRef.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [medir]);

  // A roda do mouse precisa de listener não-passivo para virar scroll horizontal.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;

    const naRoda = (evento: WheelEvent) => {
      if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) return;
      const rolavel = el.scrollWidth - el.clientWidth;
      if (rolavel <= 0) return;
      const noInicio = el.scrollLeft <= 0 && evento.deltaY < 0;
      const noFim = el.scrollLeft >= rolavel - 1 && evento.deltaY > 0;
      if (noInicio || noFim) return; // devolve o gesto para a página
      evento.preventDefault();
      el.scrollLeft += evento.deltaY;
    };

    el.addEventListener("wheel", naRoda, { passive: false });
    return () => el.removeEventListener("wheel", naRoda);
  }, []);

  useEffect(() => {
    return () => {
      if (animacao.current != null) cancelAnimationFrame(animacao.current);
    };
  }, []);

  const pararInercia = () => {
    if (animacao.current != null) cancelAnimationFrame(animacao.current);
    animacao.current = null;
  };

  const encerrarArrasto = () => {
    const el = trilhoRef.current;
    if (!el || !arrasto.current.ativo) return;
    arrasto.current.ativo = false;

    // Pressionar sem arrastar é um clique: sai do caminho na hora, senão o
    // pointer-events desligado engoliria a navegação do card.
    if (!arrastou.current) {
      el.removeAttribute("data-arrastando");
      medir();
      return;
    }

    const soltar = () => {
      el.removeAttribute("data-arrastando");
      // O scroll-snap sozinho não realinha depois de um arraste programático:
      // levamos o trilho até a posição exata do card mais próximo.
      const card = el.children[indiceMaisProximo(el)] as HTMLElement | undefined;
      if (card) {
        el.scrollTo({
          left: destinoDoCard(el, card),
          behavior: prefereMenosMovimento() ? "auto" : "smooth",
        });
      }
      // A flag de arraste só serve para engolir o clique que vem logo em
      // seguida; se ele não vier, ela precisa sair do caminho do próximo.
      setTimeout(() => {
        arrastou.current = false;
      }, 0);
      medir();
    };

    if (prefereMenosMovimento()) {
      soltar();
      return;
    }

    let velocidade = arrasto.current.velocidade;
    const passo = () => {
      velocidade *= ATRITO;
      if (Math.abs(velocidade) < VELOCIDADE_MINIMA) {
        animacao.current = null;
        soltar();
        return;
      }
      el.scrollLeft -= velocidade;
      medir();
      animacao.current = requestAnimationFrame(passo);
    };
    animacao.current = requestAnimationFrame(passo);
  };

  const aoApontar = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== "mouse" || evento.button !== 0) return;
    const el = trilhoRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    pararInercia();
    arrastou.current = false;
    arrasto.current = {
      ativo: true,
      inicioX: evento.clientX,
      inicioScroll: el.scrollLeft,
      ultimoX: evento.clientX,
      ultimoT: evento.timeStamp,
      velocidade: 0,
    };
  };

  const aoMover = (evento: React.PointerEvent<HTMLDivElement>) => {
    const el = trilhoRef.current;
    if (!el || !arrasto.current.ativo) return;

    const deslocamento = evento.clientX - arrasto.current.inicioX;
    // O modo de arraste só começa depois que o dedo/cursor realmente andou.
    if (Math.abs(deslocamento) > TOLERANCIA_CLIQUE && !arrastou.current) {
      arrastou.current = true;
      el.setAttribute("data-arrastando", "true");
    }

    el.scrollLeft = arrasto.current.inicioScroll - deslocamento;

    const intervalo = evento.timeStamp - arrasto.current.ultimoT;
    if (intervalo > 0) {
      arrasto.current.velocidade =
        ((evento.clientX - arrasto.current.ultimoX) / intervalo) * 16;
      arrasto.current.ultimoX = evento.clientX;
      arrasto.current.ultimoT = evento.timeStamp;
    }
    medir();
  };

  // Um arraste não deve abrir o evento que estava sob o cursor.
  const aoClicarCapturando = (evento: React.MouseEvent) => {
    if (!arrastou.current) return;
    evento.preventDefault();
    evento.stopPropagation();
    arrastou.current = false;
  };

  const deslocar = (direcao: 1 | -1) => {
    const el = trilhoRef.current;
    if (!el || el.children.length === 0) return;

    pararInercia();
    const destino = Math.min(
      el.children.length - 1,
      Math.max(0, indiceMaisProximo(el) + direcao)
    );
    el.scrollTo({
      left: destinoDoCard(el, el.children[destino] as HTMLElement),
      behavior: prefereMenosMovimento() ? "auto" : "smooth",
    });
  };

  const aoTeclar = (evento: React.KeyboardEvent) => {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      deslocar(1);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      deslocar(-1);
    }
  };

  const temOverflow = podeVoltar || podeAvancar;
  const larguraBarra = Math.max(proporcao, 0.12);

  return (
    <div className="vitrine-area relative">
      <div
        ref={trilhoRef}
        role="region"
        tabIndex={0}
        aria-label={`${rotulo}. Use as setas do teclado para navegar.`}
        className="vitrine py-1"
        onScroll={medir}
        onPointerDown={aoApontar}
        onPointerMove={aoMover}
        onPointerUp={encerrarArrasto}
        onPointerCancel={encerrarArrasto}
        onPointerLeave={encerrarArrasto}
        onClickCapture={aoClicarCapturando}
        onKeyDown={aoTeclar}
      >
        {children}
      </div>

      {temOverflow && (
        <>
          <SetaVitrine direcao="anterior" ativa={podeVoltar} aoClicar={() => deslocar(-1)} />
          <SetaVitrine direcao="proxima" ativa={podeAvancar} aoClicar={() => deslocar(1)} />

          <div className="recuo-vitrine mt-6 h-px overflow-hidden bg-asfalto/15" aria-hidden>
            <div
              className="h-px bg-asfalto transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform"
              style={{
                width: `${larguraBarra * 100}%`,
                transform: `translateX(${(progresso * (1 - larguraBarra) * 100) / larguraBarra}%)`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SetaVitrine({
  direcao,
  ativa,
  aoClicar,
}: {
  direcao: "anterior" | "proxima";
  ativa: boolean;
  aoClicar: () => void;
}) {
  const anterior = direcao === "anterior";
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={!ativa}
      aria-label={anterior ? "Ver provas anteriores" : "Ver próximas provas"}
      className={`acao absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-asfalto/20 bg-papel text-asfalto md:flex ${
        anterior ? "left-2" : "right-2"
      } ${
        ativa
          ? "cursor-pointer opacity-100 hover:border-asfalto hover:bg-white"
          : "pointer-events-none opacity-0"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden
      >
        <path d={anterior ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} strokeLinecap="square" />
      </svg>
    </button>
  );
}
