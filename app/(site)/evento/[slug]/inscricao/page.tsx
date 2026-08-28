import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormularioInscricao } from "@/components/formulario-inscricao";
import { detalheEvento } from "@/lib/consultas";
import { organizadorPrincipal } from "@/lib/organizador";
import { dataCurta } from "@/lib/formatos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dados = await detalheEvento(slug);
  return {
    title: dados ? `Inscrição · ${dados.evento.nome}` : "Inscrição",
    robots: { index: false },
  };
}

export default async function PaginaInscricao({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dados, organizador] = await Promise.all([detalheEvento(slug), organizadorPrincipal()]);

  if (!dados) notFound();

  const { evento, modalidades, lote, estado } = dados;

  // Inscrição fechada não tem formulário: o participante volta para a prova, que
  // já explica o motivo.
  if (!estado.aberto || !lote) redirect(`/evento/${slug}`);

  const formasPagamento = [
    ...(evento.aceitaPix ? [{ valor: "pix" as const, rotulo: "Pix" }] : []),
    ...(evento.aceitaDinheiro
      ? [{ valor: "dinheiro" as const, rotulo: "Dinheiro na retirada do kit" }]
      : []),
  ];

  return (
    <div className="pagina py-8 md:py-12">
      <nav className="mb-6 text-sm">
        <Link
          href={`/evento/${slug}`}
          className="acao text-traco underline underline-offset-4 hover:text-asfalto"
        >
          ← Voltar para {evento.nome}
        </Link>
      </nav>

      <header className="mb-8">
        <p className="rotulo text-traco">
          {dataCurta(evento.dataEvento)} · {evento.cidade} · {evento.uf}
        </p>
        <h1 className="mt-3 text-xl md:text-2xl">Fazer inscrição</h1>
        <p className="mt-3 max-w-md text-sm text-traco">
          Preencha uma vez só. No fim você recebe seu número de inscrição e finaliza o
          pagamento no WhatsApp.
        </p>
      </header>

      <FormularioInscricao
        dados={{
          slug: evento.slug,
          nomeEvento: evento.nome,
          dataEventoISO: evento.dataEvento.toISOString(),
          regulamentoUrl: evento.regulamentoUrl,
          whatsappOrganizador: organizador?.whatsapp ?? null,
          modalidades: modalidades.map((m) => ({
            id: m.id,
            nome: m.nome,
            idadeMinima: m.idadeMinima,
            disponivel: m.disponivel,
          })),
          lote: { id: lote.id, nome: lote.nome, precoCentavos: lote.precoCentavos },
          formasPagamento,
        }}
      />
    </div>
  );
}
