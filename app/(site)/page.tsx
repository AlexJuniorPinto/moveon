import { CardEvento } from "@/components/card-evento";
import { Vitrine } from "@/components/vitrine";
import { IconeSeta, IconeWhatsapp } from "@/components/icones";
import { classesBotao } from "@/components/ui/botao";
import { vitrine } from "@/lib/consultas";
import { organizadorPrincipal } from "@/lib/organizador";
import { dataPorExtenso } from "@/lib/formatos";

export const revalidate = 60;

function diasAte(data: Date): number {
  const umDia = 86_400_000;
  return Math.max(0, Math.ceil((data.getTime() - Date.now()) / umDia));
}

export default async function Home() {
  const [eventos, organizador] = await Promise.all([vitrine(), organizadorPrincipal()]);

  // A vitrine prioriza destaques; a contagem regressiva é sempre da data mais próxima.
  const proxima = [...eventos].sort(
    (a, b) => a.dataEvento.getTime() - b.dataEvento.getTime()
  )[0];

  return (
    <>
      <Hero proxima={proxima} whatsapp={organizador?.whatsapp ?? null} />

      <section id="provas" className="ancora pt-12 md:pt-24">
        <div className="pagina mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="rotulo text-traco">Vitrine</p>
            <h2 className="mt-2 text-xl md:text-2xl">Provas abertas</h2>
          </div>
          {eventos.length > 0 && (
            <p className="dados hidden text-sm text-traco sm:block">
              {eventos.length} {eventos.length === 1 ? "prova" : "provas"}
            </p>
          )}
        </div>

        {eventos.length > 0 ? (
          <Vitrine>
            {eventos.map((evento, indice) => (
              <CardEvento key={evento.slug} evento={evento} prioridade={indice < 2} />
            ))}
          </Vitrine>
        ) : (
          <VitrineVazia whatsapp={organizador?.whatsapp ?? null} />
        )}
      </section>

      <ComoFunciona />
    </>
  );
}

function Hero({
  proxima,
  whatsapp,
}: {
  proxima: { nome: string; cidade: string; uf: string; dataEvento: Date } | undefined;
  whatsapp: string | null;
}) {
  if (!proxima) {
    return (
      <section className="sobre-escuro bg-asfalto text-papel">
        <div className="pagina py-16 md:py-24">
          <p className="rotulo text-papel/50">MoveON</p>
          <h1 className="mt-4 max-w-2xl text-2xl md:text-3xl">
            Nenhuma prova aberta agora.
          </h1>
          <p className="mt-4 max-w-md text-papel/70">
            Siga a organização para saber da próxima. Assim que uma corrida abrir, ela
            aparece aqui.
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${classesBotao("avanco", "grande")} mt-8`}
            >
              <IconeWhatsapp className="size-5" />
              Falar com a organização
            </a>
          )}
        </div>
      </section>
    );
  }

  const dias = diasAte(proxima.dataEvento);
  const urgente = dias <= 7;

  return (
    <section className="sobre-escuro bg-asfalto text-papel">
      <div className="pagina py-11 md:py-20">
        <p className="rotulo text-papel/50">Próxima prova</p>

        <h1 className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span
            className={`numeral text-[clamp(3.5rem,15vw,9rem)] ${urgente ? "text-amarelo" : "text-papel"}`}
          >
            {dias === 0 ? "hoje" : dias}
          </span>
          {dias > 0 && (
            <span className="font-display text-xl font-extrabold [font-stretch:125%] md:text-2xl">
              {dias === 1 ? "dia" : "dias"}
            </span>
          )}
        </h1>

        <p className="mt-5 max-w-xl text-base text-papel/80 md:text-lg">
          {dias === 0 ? "É hoje: " : dias === 1 ? "Falta um dia para a " : "Faltam para a "}
          <strong className="font-semibold text-papel">{proxima.nome}</strong>, em{" "}
          {proxima.cidade} · {proxima.uf}.
        </p>
        <p className="dados mt-2 text-sm text-papel/50 first-letter:uppercase">
          {dataPorExtenso(proxima.dataEvento)}
        </p>

        <a href="#provas" className={`${classesBotao("avanco", "grande")} mt-7`}>
          Ver provas abertas
          <IconeSeta className="size-4" />
        </a>
      </div>
    </section>
  );
}

function VitrineVazia({ whatsapp }: { whatsapp: string | null }) {
  return (
    <div className="pagina">
      <div className="border border-dashed border-asfalto/25 bg-white px-6 py-14 text-center">
        <p className="text-lg font-semibold">Nenhuma prova aberta agora.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-traco">
          Siga a organização para saber da próxima.
        </p>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${classesBotao("contorno")} mt-6`}
          >
            <IconeWhatsapp className="size-4 text-verde-escuro" />
            Falar com a organização
          </a>
        )}
      </div>
    </div>
  );
}

const PASSOS = [
  {
    titulo: "Escolha a prova",
    texto: "Arraste a vitrine, veja distância, data e valor, e abra a corrida que interessa.",
  },
  {
    titulo: "Preencha seus dados",
    texto: "Um formulário só: nome, CPF, tamanho da camisa e contato de emergência.",
  },
  {
    titulo: "Finalize no WhatsApp",
    texto: "Você recebe seu número de inscrição e combina o Pix direto com a organização.",
  },
];

function ComoFunciona() {
  return (
    <section className="pagina pt-20 md:pt-28">
      <p className="rotulo text-traco">Como funciona</p>
      <h2 className="mt-2 max-w-lg text-xl md:text-2xl">Três passos, menos de dois minutos.</h2>

      <ol className="mt-10 grid gap-px border border-asfalto/15 bg-asfalto/15 md:grid-cols-3">
        {PASSOS.map((passo, indice) => (
          <li key={passo.titulo} className="bg-papel p-6 md:p-8">
            <span className="dados text-sm text-azul">
              {String(indice + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-lg">{passo.titulo}</h3>
            <p className="mt-2 text-sm text-traco">{passo.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
