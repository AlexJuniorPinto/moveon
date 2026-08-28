import Link from "next/link";
import { CardEvento } from "@/components/card-evento";
import { Vitrine } from "@/components/vitrine";
import { Revela } from "@/components/revela";
import { HeroExperiencia } from "@/components/hero-experiencia";
import { IconeSeta, IconeWhatsapp } from "@/components/icones";
import { classesBotao } from "@/components/ui/botao";
import { vitrine, type CartaoEvento } from "@/lib/consultas";
import { organizadorPrincipal } from "@/lib/organizador";
import { dataCurta, etiquetaData } from "@/lib/formatos";

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

      <section id="provas" className="ancora luz-papel pt-14 md:pt-24">
        <div className="pagina mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl">Provas abertas</h2>
          </div>
          {eventos.length > 0 && (
            <p className="dados hidden text-sm text-traco sm:block">
              {eventos.length} {eventos.length === 1 ? "prova" : "provas"}
            </p>
          )}
        </div>

        {eventos.length > 0 ? (
          <Revela seletor=".vitrine > a">
            <Vitrine>
              {eventos.map((evento, indice) => (
                <CardEvento key={evento.slug} evento={evento} prioridade={indice < 2} />
              ))}
            </Vitrine>
          </Revela>
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
  proxima: CartaoEvento | undefined;
  whatsapp: string | null;
}) {
  if (!proxima) {
    return (
      <HeroExperiencia>
        <div className="pagina hero-conteudo pb-14 md:pb-20">
          <h1 className="hero-titulo max-w-2xl text-[clamp(2rem,5vw,3.25rem)]">
            Nenhuma prova aberta agora.
          </h1>
          <p className="hero-linha mt-4 max-w-md text-papel/75">
            Assim que a organização abrir uma corrida, ela aparece aqui. Fale com a
            equipe para saber da próxima data.
          </p>
          {whatsapp && (
            <div className="mt-8">
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBotao("avanco", "grande")}
              >
                <IconeWhatsapp className="size-5" />
                Falar com a organização
              </a>
            </div>
          )}
        </div>
      </HeroExperiencia>
    );
  }

  const dias = diasAte(proxima.dataEvento);
  const urgente = dias <= 7;
  const eHoje = dias === 0;
  const semana = etiquetaData(proxima.dataEvento).diaSemana;

  return (
    <HeroExperiencia>
      <div className="pagina hero-conteudo pb-14 md:pb-20">
        <h1 className="hero-titulo max-w-3xl text-[clamp(2.25rem,6vw,4rem)]">
          {proxima.nome}
        </h1>

        <p className="hero-linha mt-4 max-w-md text-papel/75">
          Inscrição em um formulário só, e o pagamento você combina direto no
          WhatsApp da organização.
        </p>

        {/* A placa de largada: a contagem é a leitura do instrumento, os dados da
            prova são as colunas ao lado. O numeral rola de trás da máscara, como
            o dígito de um cronômetro virando. */}
        <div className="placa mt-8 max-w-xl">
          <p className="placa-leitura">
            <span className="mascara">
              <span
                data-palavra={eHoje ? "sim" : "nao"}
                className={`numeral placa-numeral block ${
                  urgente ? "text-amarelo" : "text-papel"
                }`}
              >
                {eHoje ? "hoje" : dias}
              </span>
            </span>
            {!eHoje && (
              <span className={`rotulo ${urgente ? "text-amarelo" : "text-papel/60"}`}>
                {dias === 1 ? "dia" : "dias"}
              </span>
            )}
          </p>

          <div className="placa-dados">
            <p className="placa-linha">
              <span className="rotulo text-papel/60">Largada</span>
              <span className="dados text-sm text-papel">
                {semana} · {dataCurta(proxima.dataEvento)}
              </span>
            </p>
            <p className="placa-linha">
              <span className="rotulo text-papel/60">Onde</span>
              <span className="dados text-sm text-papel">
                {proxima.cidade} · {proxima.uf}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/evento/${proxima.slug}`}
            className={`${classesBotao("avanco", "grande")} group`}
          >
            Abrir a {proxima.nome}
            <IconeSeta className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
          </Link>
          <a href="#provas" className={classesBotao("contorno-claro", "grande")}>
            Ver todas as provas
          </a>
        </div>
      </div>
    </HeroExperiencia>
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
      <h2 className="max-w-lg text-xl md:text-2xl">Três passos, menos de dois minutos.</h2>

      <Revela seletor="li">
        <ol className="mt-10 grid gap-px border border-asfalto/15 bg-asfalto/15 md:grid-cols-3">
          {PASSOS.map((passo, indice) => (
            <li key={passo.titulo} className="group bg-papel p-6 md:p-8">
              <span className="numeral numeral-veloz block text-2xl text-azul/25 transition-colors duration-300 group-hover:text-verde">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg">{passo.titulo}</h3>
              <p className="mt-2 text-sm text-traco">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </Revela>
    </section>
  );
}
