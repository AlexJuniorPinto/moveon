import Link from "next/link";
import { notFound } from "next/navigation";
import { Etiqueta, entradaAdmin } from "@/components/admin/campos";
import { classesBotao } from "@/components/ui/botao";
import { prisma } from "@/lib/prisma";
import { mudarStatusInscricoes } from "@/lib/acoes-admin";
import { montaFiltro, type FiltroInscritos } from "@/lib/filtros-inscricao";
import { STATUS_INSCRICAO, STATUS_QUE_OCUPAM_VAGA } from "@/lib/regras";
import { categoriaEtaria } from "@/lib/validacao";
import { dataHora, formataMoeda, mascaraCpf, telefoneLegivel } from "@/lib/formatos";

export const dynamic = "force-dynamic";

export default async function Inscritos({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FiltroInscritos>;
}) {
  const { id } = await params;
  const filtros = await searchParams;

  const evento = await prisma.evento.findFirst({
    where: { id, deletedAt: null },
    include: {
      modalidades: { orderBy: { ordem: "asc" } },
      lotes: { orderBy: { ordem: "asc" } },
    },
  });
  if (!evento) notFound();

  const where = montaFiltro(evento.id, filtros);

  const [inscricoes, todas] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { modalidade: true, lote: true },
      take: 500,
    }),
    prisma.inscricao.findMany({
      where: { eventoId: evento.id, status: { in: STATUS_QUE_OCUPAM_VAGA } },
      select: { tamanhoCamisa: true, modeloCamisa: true, status: true, valorCentavos: true },
    }),
  ]);

  const camisas = contaCamisas(todas);
  const confirmadas = todas.filter((i) => i.status === "confirmada").length;
  const receita = todas.reduce((soma, i) => soma + i.valorCentavos, 0);

  const parametrosCsv = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => Boolean(valor)) as [string, string][]
  ).toString();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <nav className="text-sm">
          <Link
            href={`/admin/eventos/${evento.id}`}
            className="acao text-traco underline underline-offset-4 hover:text-asfalto"
          >
            ← {evento.nome}
          </Link>
        </nav>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl">Inscritos</h1>
            <p className="dados mt-2 text-sm text-traco">
              {todas.length} inscritos · {confirmadas} confirmados ·{" "}
              {formataMoeda(receita)} previstos
            </p>
          </div>

          <a
            href={`/api/admin/eventos/${evento.id}/csv${parametrosCsv ? `?${parametrosCsv}` : ""}`}
            className={classesBotao("contorno")}
          >
            Baixar CSV
          </a>
        </div>
      </div>

      {/* Relatório de camisas */}
      <section className="border border-asfalto/15 bg-white p-5">
        <h2 className="rotulo text-traco">Camisas a pedir</h2>
        <p className="mt-1 text-xs text-traco">
          Conta apenas inscrições não canceladas. Use para fechar o pedido com a confecção.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-asfalto/15 text-left">
                <th scope="col" className="rotulo py-2 font-medium text-traco">
                  Modelo
                </th>
                {camisas.tamanhos.map((tamanho) => (
                  <th key={tamanho} scope="col" className="rotulo py-2 text-right font-medium text-traco">
                    {tamanho}
                  </th>
                ))}
                <th scope="col" className="rotulo py-2 text-right font-medium text-traco">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {camisas.linhas.map((linha) => (
                <tr key={linha.modelo} className="border-b border-asfalto/10 last:border-0">
                  <th scope="row" className="py-2 text-left font-medium">
                    {linha.modelo}
                  </th>
                  {camisas.tamanhos.map((tamanho) => (
                    <td key={tamanho} className="dados py-2 text-right">
                      {linha.contagem[tamanho] || "—"}
                    </td>
                  ))}
                  <td className="dados py-2 text-right font-semibold">{linha.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Filtros */}
      <form method="get" className="flex flex-wrap items-end gap-3 border border-asfalto/15 bg-white p-4">
        <label className="min-w-[180px] flex-1">
          <span className="rotulo mb-1 block text-traco">Buscar</span>
          <input
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            placeholder="Nome, CPF ou telefone"
            className={entradaAdmin}
          />
        </label>

        <label>
          <span className="rotulo mb-1 block text-traco">Status</span>
          <select name="status" defaultValue={filtros.status ?? ""} className={entradaAdmin}>
            <option value="">Todos</option>
            {Object.entries(STATUS_INSCRICAO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="rotulo mb-1 block text-traco">Modalidade</span>
          <select name="modalidade" defaultValue={filtros.modalidade ?? ""} className={entradaAdmin}>
            <option value="">Todas</option>
            {evento.modalidades.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="rotulo mb-1 block text-traco">Lote</span>
          <select name="lote" defaultValue={filtros.lote ?? ""} className={entradaAdmin}>
            <option value="">Todos</option>
            {evento.lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={classesBotao("estrutura")}>
          Filtrar
        </button>
        <Link href={`/admin/eventos/${evento.id}/inscritos`} className={classesBotao("texto")}>
          Limpar
        </Link>
      </form>

      {/* Ações em massa — os checkboxes da tabela apontam para este form. */}
      <form
        id="acoesEmMassa"
        action={mudarStatusInscricoes}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="eventoId" value={evento.id} />
        <span className="text-sm text-traco">Selecionados:</span>
        <button
          type="submit"
          name="status"
          value="confirmada"
          className={classesBotao("avanco")}
        >
          Marcar como confirmada
        </button>
        <button
          type="submit"
          name="status"
          value="cancelada"
          className={classesBotao("contorno")}
        >
          Cancelar
        </button>
      </form>

      {/* Tabela */}
      {inscricoes.length === 0 ? (
        <div className="border border-dashed border-asfalto/25 bg-white p-10 text-center">
          <p className="font-semibold">Nenhuma inscrição encontrada.</p>
          <p className="mt-2 text-sm text-traco">
            {todas.length > 0
              ? "Ajuste os filtros para ver as outras inscrições."
              : "Quando alguém se inscrever, a inscrição aparece aqui na hora."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-asfalto/15 bg-white">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-asfalto/15 text-left">
                <th scope="col" className="w-10 px-3 py-3">
                  <span className="sr-only">Selecionar</span>
                </th>
                {[
                  "Número",
                  "Nome",
                  "Modalidade",
                  "Camisa",
                  "Telefone",
                  "Valor",
                  "Status",
                  "Data",
                ].map((coluna) => (
                  <th key={coluna} scope="col" className="rotulo px-3 py-3 font-medium text-traco">
                    {coluna}
                  </th>
                ))}
                <th scope="col" className="rotulo px-3 py-3 text-right font-medium text-traco">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((inscricao) => (
                <tr key={inscricao.id} className="border-b border-asfalto/10 last:border-0">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      form="acoesEmMassa"
                      name="ids"
                      value={inscricao.id}
                      aria-label={`Selecionar ${inscricao.nomeCompleto}`}
                      className="size-4 accent-azul"
                    />
                  </td>
                  <td className="dados px-3 py-3 whitespace-nowrap">{inscricao.numeroInscricao}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium">{inscricao.nomeCompleto}</span>
                    <span className="dados block text-xs text-traco">
                      {mascaraCpf(inscricao.cpf)} ·{" "}
                      {categoriaEtaria(inscricao.dataNascimento, evento.dataEvento)}
                    </span>
                  </td>
                  <td className="px-3 py-3">{inscricao.modalidade.nome}</td>
                  <td className="dados px-3 py-3">
                    {inscricao.tamanhoCamisa}
                    {inscricao.modeloCamisa === "baby_look" && (
                      <span className="text-traco"> BL</span>
                    )}
                  </td>
                  <td className="dados px-3 py-3 whitespace-nowrap">
                    <a
                      href={`https://wa.me/${inscricao.telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="acao text-azul underline underline-offset-4"
                    >
                      {telefoneLegivel(inscricao.telefone)}
                    </a>
                  </td>
                  <td className="dados px-3 py-3 whitespace-nowrap">
                    {formataMoeda(inscricao.valorCentavos)}
                  </td>
                  <td className="px-3 py-3">
                    <Etiqueta
                      status={inscricao.status}
                      rotulo={STATUS_INSCRICAO[inscricao.status as keyof typeof STATUS_INSCRICAO] ?? inscricao.status}
                    />
                  </td>
                  <td className="dados px-3 py-3 text-xs whitespace-nowrap text-traco">
                    {dataHora(inscricao.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      {inscricao.status !== "confirmada" && (
                        <form action={mudarStatusInscricoes}>
                          <input type="hidden" name="eventoId" value={evento.id} />
                          <input type="hidden" name="id" value={inscricao.id} />
                          <input type="hidden" name="status" value="confirmada" />
                          <button
                            type="submit"
                            className="acao cursor-pointer text-xs font-semibold text-verde-escuro underline underline-offset-4"
                          >
                            Confirmar
                          </button>
                        </form>
                      )}
                      {inscricao.status !== "cancelada" && (
                        <form action={mudarStatusInscricoes}>
                          <input type="hidden" name="eventoId" value={evento.id} />
                          <input type="hidden" name="id" value={inscricao.id} />
                          <input type="hidden" name="status" value="cancelada" />
                          <button
                            type="submit"
                            className="acao cursor-pointer text-xs text-traco underline underline-offset-4 hover:text-erro"
                          >
                            Cancelar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inscricoes.length === 500 && (
        <p className="text-sm text-traco">
          Mostrando as 500 inscrições mais recentes. Use os filtros ou baixe o CSV para ver
          todas.
        </p>
      )}
    </div>
  );
}

function contaCamisas(
  inscricoes: { tamanhoCamisa: string; modeloCamisa: string | null }[]
) {
  const tamanhos = ["PP", "P", "M", "G", "GG", "XGG"];
  const modelos = [
    { chave: "masculina", rotulo: "Masculina" },
    { chave: "baby_look", rotulo: "Baby look" },
    { chave: "", rotulo: "Sem modelo" },
  ];

  const linhas = modelos
    .map(({ chave, rotulo }) => {
      const doModelo = inscricoes.filter((i) => (i.modeloCamisa ?? "") === chave);
      const contagem: Record<string, number> = {};
      for (const tamanho of tamanhos) {
        contagem[tamanho] = doModelo.filter((i) => i.tamanhoCamisa === tamanho).length;
      }
      return { modelo: rotulo, contagem, total: doModelo.length };
    })
    .filter((linha) => linha.total > 0);

  if (linhas.length === 0) {
    linhas.push({
      modelo: "Total",
      contagem: Object.fromEntries(tamanhos.map((t) => [t, 0])),
      total: 0,
    });
  }

  return { tamanhos, linhas };
}
