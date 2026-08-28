"use client";

import { useEffect, useState } from "react";

/**
 * A placa de largada, agora como instrumento de verdade.
 *
 * Antes a "contagem" era um número de dias renderizado no servidor: um rótulo
 * com cara de cronômetro, parado. Aqui o relógio anda. Três camadas de
 * movimento, cada uma com um trabalho:
 *
 *   primária   — o dígito que vira rola para fora da máscara e o novo sobe no
 *                lugar, como o disco de um contador mecânico;
 *   secundária — o fio de segundos varre a borda de cima da chapa, ligando um
 *                salto discreto ao outro;
 *   ambiente   — os dois-pontos respiram na batida, o sinal de que o
 *                instrumento está rodando mesmo quando ninguém olha os dígitos.
 *
 * A urgência continua sendo cor, não movimento (regra do DESIGN.md): a menos de
 * uma semana da largada o acento verde vira amarelo inteiro, nunca os dois.
 */

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

type Leitura = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  passou: boolean;
};

function leitura(restante: number): Leitura {
  const r = Math.max(0, restante);
  return {
    dias: Math.floor(r / DIA),
    horas: Math.floor(r / HORA) % 24,
    minutos: Math.floor(r / MINUTO) % 60,
    segundos: Math.floor(r / SEGUNDO) % 60,
    passou: restante <= 0,
  };
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function frase({ dias, horas, minutos, passou }: Leitura): string {
  if (passou) return "A largada já foi dada.";
  if (dias > 0) {
    const d = `${dias} ${dias === 1 ? "dia" : "dias"}`;
    return `Faltam ${d} e ${horas} ${horas === 1 ? "hora" : "horas"} para a largada.`;
  }
  if (horas > 0) {
    return `A largada é hoje, daqui a ${horas} ${horas === 1 ? "hora" : "horas"} e ${minutos} ${
      minutos === 1 ? "minuto" : "minutos"
    }.`;
  }
  return `A largada é hoje, daqui a ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`;
}

/**
 * Um dígito que rola quando muda. Guarda o valor anterior para que o algarismo
 * que sai tenha para onde ir — sem isso a máscara pisca vazia no meio da troca.
 */
function Digito({ valor }: { valor: string }) {
  const [quadro, setQuadro] = useState({
    atual: valor,
    anterior: null as string | null,
    chave: 0,
  });

  // Ajuste de estado durante o render: React descarta esta passagem e reexecuta
  // com o quadro novo, então o dígito nunca aparece defasado por um frame.
  if (quadro.atual !== valor) {
    setQuadro((q) => ({ atual: valor, anterior: q.atual, chave: q.chave + 1 }));
  }

  return (
    <span className="crono-digito">
      <span
        key={quadro.chave}
        className="crono-rolo"
        data-rola={quadro.anterior === null ? "nao" : "sim"}
      >
        {quadro.anterior !== null && (
          <span className="crono-face crono-face-sai">{quadro.anterior}</span>
        )}
        <span className="crono-face crono-face-entra">{quadro.atual}</span>
      </span>
    </span>
  );
}

function Par({ valor }: { valor: string }) {
  return (
    <span className="crono-par">
      <Digito valor={valor[0]} />
      <Digito valor={valor[1]} />
    </span>
  );
}

export function Cronometro({
  alvo,
  restanteInicial,
  className = "",
  children,
}: {
  /** ISO da largada. O relógio do cliente é a fonte da verdade. */
  alvo: string;
  /** Quanto faltava quando a página foi gerada — o primeiro quadro, igual no
   *  servidor e na hidratação. O primeiro tique sincroniza com o relógio real. */
  restanteInicial: number;
  className?: string;
  /** As colunas de dados da prova, à direita da leitura. */
  children: React.ReactNode;
}) {
  const [restante, setRestante] = useState(restanteInicial);

  useEffect(() => {
    const largada = new Date(alvo).getTime();
    let id: number;

    // Tique alinhado ao segundo cheio: um setInterval(1000) escorrega e os
    // dígitos passam a virar fora da batida.
    const marcar = () => {
      const agora = Date.now();
      setRestante(largada - agora);
      id = window.setTimeout(marcar, SEGUNDO - (agora % SEGUNDO) + 8);
    };

    const resincronizar = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(id);
      marcar();
    };

    marcar();
    document.addEventListener("visibilitychange", resincronizar);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", resincronizar);
    };
  }, [alvo]);

  const l = leitura(restante);
  const urgente = l.passou || l.dias <= 7;
  const eHoje = l.dias === 0;
  const titulo = eHoje ? "hoje" : String(l.dias);

  return (
    <div
      className={`placa ${className}`}
      data-urgente={urgente ? "sim" : "nao"}
      data-parado={l.passou ? "sim" : "nao"}
      // O fio de segundos varre em um minuto e volta ao zero sem transição —
      // senão ele desenharia o caminho de volta na virada.
      data-virando={l.segundos === 0 ? "sim" : "nao"}
      style={{ "--avanco": l.segundos / 60 } as React.CSSProperties}
    >
      <span className="placa-fio-segundos" aria-hidden="true" />

      <div className="placa-leitura">
        <p className="sr-only">{frase(l)}</p>

        <p className="placa-contagem" aria-hidden="true">
          <span className="mascara">
            <span
              key={titulo}
              data-palavra={eHoje ? "sim" : "nao"}
              className="numeral placa-numeral block"
            >
              {titulo}
            </span>
          </span>
          {!eHoje && <span className="rotulo placa-unidade">{l.dias === 1 ? "dia" : "dias"}</span>}
        </p>

        {l.passou ? (
          <p className="crono-fino crono-encerrado">Largada dada</p>
        ) : (
          <p className="crono-fino dados" aria-hidden="true">
            <Par valor={doisDigitos(l.horas)} />
            <span className="crono-batida">:</span>
            <Par valor={doisDigitos(l.minutos)} />
            <span className="crono-batida">:</span>
            <span className="crono-par crono-par-vivo">
              <Digito valor={doisDigitos(l.segundos)[0]} />
              <Digito valor={doisDigitos(l.segundos)[1]} />
            </span>
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
