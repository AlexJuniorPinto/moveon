"use client";

import { useEffect, useRef, useState } from "react";
import { classesBotao } from "@/components/ui/botao";
import { IconeCheck, IconeCopiar, IconeWhatsapp } from "@/components/icones";

export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      return; // navegador sem permissão de área de transferência: o número está na tela
    }
    setCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="acao inline-flex min-h-10 items-center gap-2 rounded-[4px] border border-asfalto/25 px-3 text-sm font-medium hover:border-asfalto hover:bg-asfalto/5"
    >
      {copiado ? <IconeCheck className="size-4 text-verde-escuro" /> : <IconeCopiar className="size-4" />}
      <span aria-live="polite">{copiado ? "Copiado" : "Copiar número"}</span>
    </button>
  );
}

export function BotaoWhatsapp({
  numeroInscricao,
  href,
  rotulo = "Finalizar no WhatsApp",
}: {
  numeroInscricao: string;
  href: string;
  rotulo?: string;
}) {
  // O clique também registra que o participante seguiu para o pagamento. Se a
  // requisição falhar, ele vai para o WhatsApp do mesmo jeito.
  function registrar() {
    const url = `/api/inscricoes/${encodeURIComponent(numeroInscricao)}/whatsapp`;
    try {
      if (!navigator.sendBeacon?.(url)) {
        void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      }
    } catch {
      void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registrar}
      className={`${classesBotao("avanco", "grande")} w-full`}
    >
      <IconeWhatsapp className="size-5" />
      {rotulo}
    </a>
  );
}
