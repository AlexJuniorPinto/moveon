"use client";

import { useEffect, useState } from "react";
import { Marca } from "@/components/marca";
import { IconeWhatsapp } from "@/components/icones";

/**
 * O cabeçalho só precisa saber uma coisa: se a página ainda está no topo.
 * Quem decide o que fazer com isso é o CSS — sobre o hero ele fica
 * transparente para a foto ocupar o primeiro viewport inteiro, e nas demais
 * páginas continua papel sólido em qualquer posição de rolagem.
 */
export function Cabecalho({ linkWhats }: { linkWhats: string | null }) {
  const [noTopo, setNoTopo] = useState(true);

  useEffect(() => {
    const ler = () => setNoTopo(window.scrollY < 24);
    ler();
    window.addEventListener("scroll", ler, { passive: true });
    return () => window.removeEventListener("scroll", ler);
  }, []);

  return (
    <header className="cabecalho sticky top-0 z-40" data-topo={noTopo ? "sim" : "nao"}>
      <div className="pagina flex h-(--altura-cabecalho) items-center justify-between gap-4">
        <Marca />

        {linkWhats && (
          <a
            href={linkWhats}
            target="_blank"
            rel="noopener noreferrer"
            className="botao-cabecalho acao inline-flex min-h-10 items-center gap-2 rounded-[4px] border border-asfalto/20 px-3 text-sm font-medium hover:border-asfalto hover:bg-asfalto/5"
          >
            <IconeWhatsapp className="size-4 text-verde-escuro" />
            <span className="hidden sm:inline">Falar com a organização</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        )}
      </div>
    </header>
  );
}
