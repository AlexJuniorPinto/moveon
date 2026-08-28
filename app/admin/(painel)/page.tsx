import Link from "next/link";
import { Etiqueta } from "@/components/admin/campos";
import { classesBotao } from "@/components/ui/botao";
import { prisma } from "@/lib/prisma";
import { dataCurta, formataMoeda } from "@/lib/formatos";

export const dynamic = "force-dynamic";

const STATUS_EVENTO: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export default async function PainelResumo() {
  const [eventos, agregados] = await Promise.all([
    prisma.evento.findMany({
      where: { deletedAt: null },
      orderBy: [{ dataEvento: "asc" }],
      select: { id: true, nome: true, slug: true, dataEvento: true, status: true, limiteVagas: true },
    }),
    prisma.inscricao.groupBy({
      by: ["eventoId", "status"],
      _count: { _all: true },
      _sum: { valorCentavos: true },
    }),
  ]);

  const porEvento = new Map<
    string,
    { total: number; confirmadas: number; pendentes: number; previsto: number; recebido: number }
  >();

  for (const evento of eventos) {
    porEvento.set(evento.id, {
      total: 0,
      confirmadas: 0,
      pendentes: 0,
      previsto: 0,
      recebido: 0,
    });
  }

  for (const linha of agregados) {
    const alvo = porEvento.get(linha.eventoId);
    if (!alvo) continue;
    const quantidade = linha._count._all;
    const valor = linha._sum.valorCentavos ?? 0;

    if (linha.status === "cancelada") continue;
    alvo.total += quantidade;
    alvo.previsto += valor;
    if (linha.status === "confirmada") {
      alvo.confirmadas += quantidade;
      alvo.recebido += valor;
    } else {
      alvo.pendentes += quantidade;
    }
  }

  const geral = [...porEvento.values()].reduce(
    (soma, item) => ({
      total: soma.total + item.total,
      confirmadas: soma.confirmadas + item.confirmadas,
      pendentes: soma.pendentes + item.pendentes,
      previsto: soma.previsto + item.previsto,
      recebido: soma.recebido + item.recebido,
    }),
    { total: 0, confirmadas: 0, pendentes: 0, previsto: 0, recebido: 0 }
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo text-traco">Resumo</p>
          <h1 className="mt-2 text-xl">Suas provas</h1>
        </div>
        <Link href="/admin/eventos/novo" className={classesBotao("estrutura")}>
          Criar prova
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-px border border-asfalto/15 bg-asfalto/15 lg:grid-cols-4">
        <Numero rotulo="Inscritos" valor={String(geral.total)} />
        <Numero rotulo="Confirmados" valor={String(geral.confirmadas)} />
        <Numero rotulo="Aguardando pagamento" valor={String(geral.pendentes)} destaque={geral.pendentes > 0} />
        <Numero rotulo="Receita prevista" valor={formataMoeda(geral.previsto)} />
      </dl>

      <section>
        <h2 className="rotulo text-traco">Por prova</h2>

        {eventos.length === 0 ? (
          <div className="mt-4 border border-dashed border-asfalto/25 bg-white p-10 text-center">
            <p className="font-semibold">Nenhuma prova cadastrada ainda.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-traco">
              Crie a primeira prova, adicione as modalidades e os lotes, e publique quando
              estiver pronta.
            </p>
            <Link href="/admin/eventos/novo" className={`${classesBotao("estrutura")} mt-6`}>
              Criar prova
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border border-asfalto/15 bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-asfalto/15 text-left">
                  <Th>Prova</Th>
                  <Th>Data</Th>
                  <Th>Status</Th>
                  <Th alinhamento="right">Inscritos</Th>
                  <Th alinhamento="right">Confirmados</Th>
                  <Th alinhamento="right">Previsto</Th>
                  <Th alinhamento="right">Recebido</Th>
                  <Th alinhamento="right">
                    <span className="sr-only">Ações</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const dados = porEvento.get(evento.id)!;
                  return (
                    <tr key={evento.id} className="border-b border-asfalto/10 last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/eventos/${evento.id}`}
                          className="acao underline-offset-4 hover:underline"
                        >
                          {evento.nome}
                        </Link>
                      </td>
                      <td className="dados px-4 py-3 text-traco">{dataCurta(evento.dataEvento)}</td>
                      <td className="px-4 py-3">
                        <Etiqueta status={evento.status} rotulo={STATUS_EVENTO[evento.status] ?? evento.status} />
                      </td>
                      <td className="dados px-4 py-3 text-right">
                        {dados.total}
                        {evento.limiteVagas != null && (
                          <span className="text-traco">/{evento.limiteVagas}</span>
                        )}
                      </td>
                      <td className="dados px-4 py-3 text-right">{dados.confirmadas}</td>
                      <td className="dados px-4 py-3 text-right">{formataMoeda(dados.previsto)}</td>
                      <td className="dados px-4 py-3 text-right text-azul">
                        {formataMoeda(dados.recebido)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/eventos/${evento.id}/inscritos`}
                          className="acao text-azul underline underline-offset-4"
                        >
                          Inscritos
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <dt className="rotulo text-traco">{rotulo}</dt>
      <dd className={`numeral mt-3 text-xl ${destaque ? "text-azul" : "text-asfalto"}`}>{valor}</dd>
    </div>
  );
}

function Th({
  children,
  alinhamento = "left",
}: {
  children: React.ReactNode;
  alinhamento?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`rotulo px-4 py-3 font-medium text-traco ${alinhamento === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}
