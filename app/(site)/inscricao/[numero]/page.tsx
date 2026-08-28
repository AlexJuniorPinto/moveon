import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BotaoCopiar, BotaoWhatsapp } from "@/components/acoes-inscricao";
import { IconeAlerta, IconeCheck } from "@/components/icones";
import { consultaSegura, prisma } from "@/lib/prisma";
import { organizadorPrincipal } from "@/lib/organizador";
import { linkWhatsapp, mensagemWhatsapp } from "@/lib/regras";
import {
  cpfMascaradoParaExibicao,
  dataPorExtenso,
  formataMoeda,
  telefoneLegivel,
  telefoneMascarado,
  valorSimples,
} from "@/lib/formatos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sua inscrição",
  robots: { index: false, follow: false },
};

export default async function PaginaConfirmacao({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;

  const [inscricao, organizador] = await Promise.all([
    consultaSegura(
      () =>
        prisma.inscricao.findUnique({
          where: { numeroInscricao: decodeURIComponent(numero) },
          include: { evento: true, modalidade: true, lote: true },
        }),
      null
    ),
    organizadorPrincipal(),
  ]);

  if (!inscricao) notFound();

  const confirmada = inscricao.status === "confirmada";
  const cancelada = inscricao.status === "cancelada";

  const [prefixo, sequencial] = separaNumero(inscricao.numeroInscricao);

  const href = organizador
    ? linkWhatsapp(
        organizador.whatsapp,
        mensagemWhatsapp({
          nomeEvento: inscricao.evento.nome,
          numeroInscricao: inscricao.numeroInscricao,
          nomeCompleto: inscricao.nomeCompleto,
          modalidade: inscricao.modalidade.nome,
          tamanhoCamisa: inscricao.tamanhoCamisa,
          valor: valorSimples(inscricao.valorCentavos),
        })
      )
    : null;

  return (
    <div className="pagina max-w-2xl py-10 md:py-16">
      {/* O peitoral: é o que a pessoa vai guardar. */}
      <div className="border border-asfalto/20 bg-white">
        <div className="perfuracao" aria-hidden />

        <div className="px-6 py-8 text-center md:px-10">
          <p className="rotulo text-traco">Número de inscrição</p>
          <p className="dados mt-4 text-sm text-traco">{prefixo}</p>
          <p className="numeral text-[clamp(4.5rem,22vw,7rem)] text-azul">{sequencial}</p>

          <div className="mt-6 flex justify-center">
            <BotaoCopiar texto={inscricao.numeroInscricao} />
          </div>
        </div>

        <div className="border-t border-asfalto/15 bg-asfalto px-6 py-4 text-center text-papel md:px-10">
          <p className="font-display text-lg leading-tight font-extrabold [font-stretch:110%]">
            {inscricao.evento.nome}
          </p>
          <p className="dados mt-1 text-xs text-papel/60 first-letter:uppercase">
            {dataPorExtenso(inscricao.evento.dataEvento)}
          </p>
        </div>
      </div>

      {/* Estado */}
      {cancelada ? (
        <Aviso tom="neutro" titulo="Esta inscrição foi cancelada.">
          Se isso não deveria ter acontecido, fale com a organização no WhatsApp.
        </Aviso>
      ) : confirmada ? (
        <Aviso tom="ok" titulo="Inscrição confirmada.">
          Seu pagamento foi confirmado pela organização. Leve um documento com foto na
          retirada do kit.
        </Aviso>
      ) : (
        <Aviso tom="atencao" titulo="Sua inscrição ainda não está confirmada.">
          Finalize o pagamento no WhatsApp. A organização envia o Pix e confirma sua vaga.
        </Aviso>
      )}

      {!confirmada && !cancelada && href && (
        <div className="mt-6">
          <BotaoWhatsapp numeroInscricao={inscricao.numeroInscricao} href={href} />
          <p className="mt-3 text-center text-sm text-traco">
            Sem WhatsApp neste aparelho? Chame no{" "}
            <span className="dados text-asfalto">{telefoneLegivel(organizador!.whatsapp)}</span>.
          </p>
        </div>
      )}

      {/* Resumo */}
      <section className="mt-10">
        <h2 className="rotulo text-traco">O que você enviou</h2>
        <dl className="mt-4 border-t border-asfalto/15 text-sm">
          <Linha rotulo="Nome" valor={inscricao.nomeCompleto} />
          <Linha rotulo="CPF" valor={cpfMascaradoParaExibicao(inscricao.cpf)} mono />
          <Linha rotulo="Telefone" valor={telefoneMascarado(inscricao.telefone)} mono />
          <Linha rotulo="Modalidade" valor={inscricao.modalidade.nome} />
          <Linha
            rotulo="Camisa"
            valor={`${inscricao.tamanhoCamisa}${
              inscricao.modeloCamisa === "baby_look"
                ? " · baby look"
                : inscricao.modeloCamisa === "masculina"
                  ? " · masculina"
                  : ""
            }`}
          />
          {inscricao.equipe && <Linha rotulo="Equipe" valor={inscricao.equipe} />}
          <Linha rotulo="Lote" valor={inscricao.lote.nome} />
          <Linha
            rotulo="Forma de pagamento"
            valor={inscricao.formaPagamento === "pix" ? "Pix" : "Dinheiro na retirada do kit"}
          />
          <Linha rotulo="Valor" valor={formataMoeda(inscricao.valorCentavos)} mono destaque />
        </dl>

        <p className="mt-6 text-sm text-traco">
          Guarde o número <span className="dados text-asfalto">{inscricao.numeroInscricao}</span>.
          É por ele que a organização encontra sua inscrição.
        </p>

        <p className="mt-8">
          <Link
            href={`/evento/${inscricao.evento.slug}`}
            className="acao text-sm text-traco underline underline-offset-4 hover:text-asfalto"
          >
            ← Voltar para {inscricao.evento.nome}
          </Link>
        </p>
      </section>
    </div>
  );
}

function separaNumero(numero: string): [string, string] {
  const partes = numero.split("-");
  if (partes.length < 2) return ["", numero];
  return [partes.slice(0, -1).join("-"), partes[partes.length - 1]];
}

function Aviso({
  tom,
  titulo,
  children,
}: {
  tom: "atencao" | "ok" | "neutro";
  titulo: string;
  children: React.ReactNode;
}) {
  const estilo = {
    atencao: "border-amarelo bg-amarelo/15",
    ok: "border-verde bg-verde/10",
    neutro: "border-asfalto/20 bg-asfalto/5",
  }[tom];

  return (
    <div className={`mt-8 border p-5 ${estilo}`}>
      <p className="flex items-start gap-2 font-semibold">
        {tom === "ok" ? (
          <IconeCheck className="mt-0.5 size-5 shrink-0 text-verde-escuro" />
        ) : (
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
        )}
        {titulo}
      </p>
      <p className="mt-2 pl-7 text-sm">{children}</p>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  mono = false,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  mono?: boolean;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-asfalto/15 py-3">
      <dt className="text-traco">{rotulo}</dt>
      <dd
        className={`text-right ${mono ? "dados" : ""} ${destaque ? "text-base font-semibold text-azul" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}
