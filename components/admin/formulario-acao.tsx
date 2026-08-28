"use client";

import { useActionState } from "react";
import { Botao } from "@/components/ui/botao";
import { IconeAlerta, IconeCheck } from "@/components/icones";
import type { Resultado } from "@/lib/acoes-admin";

/**
 * Envolve as ações de servidor que devolvem mensagem. O resto do painel usa
 * <form action={acao}> puro, sem JavaScript no cliente.
 */
export function FormularioAcao({
  acao,
  children,
  rotuloEnvio = "Salvar",
  rotuloEnviando = "Salvando…",
  className = "",
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  rotuloEnvio?: string;
  rotuloEnviando?: string;
  className?: string;
}) {
  const [estado, executar, pendente] = useActionState(acao, {});

  return (
    <form action={executar} className={`flex flex-col gap-5 ${className}`}>
      {children}

      <div aria-live="polite" className="empty:hidden">
        {estado.erro && (
          <p className="flex items-start gap-2 border border-erro/40 bg-erro/5 p-3 text-sm text-erro">
            <IconeAlerta className="mt-0.5 size-4 shrink-0" />
            {estado.erro}
          </p>
        )}
        {estado.ok && (
          <p className="flex items-start gap-2 border border-verde/50 bg-verde/10 p-3 text-sm">
            <IconeCheck className="mt-0.5 size-4 shrink-0 text-verde-escuro" />
            {estado.ok}
          </p>
        )}
      </div>

      <div>
        <Botao type="submit" variante="estrutura" disabled={pendente}>
          {pendente ? rotuloEnviando : rotuloEnvio}
        </Botao>
      </div>
    </form>
  );
}
