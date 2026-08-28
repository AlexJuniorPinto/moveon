import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lote, Modalidade } from "@prisma/client";
import { Etiqueta, Painel, entradaAdmin } from "@/components/admin/campos";
import { FormularioEvento } from "@/components/admin/formulario-evento";
import { classesBotao } from "@/components/ui/botao";
import { prisma } from "@/lib/prisma";
import {
  arquivarEvento,
  atualizarEvento,
  excluirLote,
  excluirModalidade,
  mudarStatusEvento,
  salvarLote,
  salvarModalidade,
} from "@/lib/acoes-admin";
import { paraCampoDataHora, paraCampoPreco } from "@/lib/formatos";

export const dynamic = "force-dynamic";

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export default async function EditarEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: { id, deletedAt: null },
    include: {
      modalidades: { orderBy: { ordem: "asc" } },
      lotes: { orderBy: { ordem: "asc" } },
    },
  });
  if (!evento) notFound();

  const usoModalidades = await prisma.inscricao.groupBy({
    by: ["modalidadeId"],
    where: { eventoId: evento.id },
    _count: { _all: true },
  });
  const usoLotes = await prisma.inscricao.groupBy({
    by: ["loteId"],
    where: { eventoId: evento.id },
    _count: { _all: true },
  });

  const emUsoModalidade = new Set(usoModalidades.map((u) => u.modalidadeId));
  const emUsoLote = new Set(usoLotes.map((u) => u.loteId));
  const podePublicar = evento.modalidades.length > 0 && evento.lotes.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <nav className="text-sm">
          <Link
            href="/admin/eventos"
            className="acao text-traco underline underline-offset-4 hover:text-asfalto"
          >
            ← Provas
          </Link>
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl">{evento.nome}</h1>
            <Etiqueta status={evento.status} rotulo={ROTULO_STATUS[evento.status] ?? evento.status} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/eventos/${evento.id}/inscritos`}
              className={classesBotao("contorno")}
            >
              Ver inscritos
            </Link>
            {evento.status === "publicado" ? (
              <form action={mudarStatusEvento}>
                <input type="hidden" name="id" value={evento.id} />
                <input type="hidden" name="status" value="rascunho" />
                <button type="submit" className={classesBotao("contorno")}>
                  Tirar do ar
                </button>
              </form>
            ) : (
              <form action={mudarStatusEvento}>
                <input type="hidden" name="id" value={evento.id} />
                <input type="hidden" name="status" value="publicado" />
                <button
                  type="submit"
                  disabled={!podePublicar}
                  className={classesBotao("estrutura")}
                >
                  Publicar
                </button>
              </form>
            )}
          </div>
        </div>

        {!podePublicar && (
          <p className="mt-4 border border-amarelo bg-amarelo/15 p-3 text-sm">
            Para publicar, cadastre ao menos uma modalidade e um lote.
          </p>
        )}
      </div>

      {/* Modalidades */}
      <Painel
        titulo="Modalidades"
        descricao="Os percursos da prova. A ordem define como aparecem na página."
      >
        <div className="flex flex-col gap-3">
          <div className="rotulo hidden gap-3 px-1 text-traco md:grid md:grid-cols-[1fr_100px_90px_90px_70px_auto]">
            <span>Nome</span>
            <span>Distância (km)</span>
            <span>Idade mín.</span>
            <span>Vagas</span>
            <span>Ordem</span>
            <span className="sr-only">Ações</span>
          </div>

          {evento.modalidades.map((modalidade) => (
            <LinhaModalidade
              key={modalidade.id}
              eventoId={evento.id}
              modalidade={modalidade}
              emUso={emUsoModalidade.has(modalidade.id)}
            />
          ))}

          <LinhaModalidade eventoId={evento.id} proximaOrdem={evento.modalidades.length} />
        </div>
      </Painel>

      {/* Lotes */}
      <Painel
        titulo="Lotes"
        descricao="O lote vigente é o primeiro lote ativo cuja janela de datas inclui hoje e que ainda tem vaga."
      >
        <div className="flex flex-col gap-3">
          <div className="rotulo hidden gap-3 px-1 text-traco lg:grid lg:grid-cols-[1fr_100px_170px_170px_80px_70px_60px_auto]">
            <span>Nome</span>
            <span>Preço (R$)</span>
            <span>Início</span>
            <span>Fim</span>
            <span>Vagas</span>
            <span>Ordem</span>
            <span>Ativo</span>
            <span className="sr-only">Ações</span>
          </div>

          {evento.lotes.map((lote) => (
            <LinhaLote
              key={lote.id}
              eventoId={evento.id}
              lote={lote}
              emUso={emUsoLote.has(lote.id)}
            />
          ))}

          <LinhaLote eventoId={evento.id} proximaOrdem={evento.lotes.length} />
        </div>
      </Painel>

      {/* Dados da prova */}
      <FormularioEvento acao={atualizarEvento} evento={evento} rotuloEnvio="Salvar prova" />

      {/* Zona de risco */}
      <section className="border border-erro/30 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-display text-base font-extrabold [font-stretch:110%]">
              Arquivar prova
            </h2>
            <p className="mt-1 max-w-md text-xs text-traco">
              A prova sai do site e do painel, mas as inscrições continuam guardadas no banco.
              Não dá para desfazer pelo painel.
            </p>
          </div>
          <form action={arquivarEvento}>
            <input type="hidden" name="id" value={evento.id} />
            <button
              type="submit"
              className="acao min-h-12 cursor-pointer rounded-[4px] border border-erro px-5 text-sm font-semibold text-erro hover:bg-erro hover:text-white"
            >
              Arquivar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function LinhaModalidade({
  eventoId,
  modalidade,
  emUso = false,
  proximaOrdem = 0,
}: {
  eventoId: string;
  modalidade?: Modalidade;
  emUso?: boolean;
  proximaOrdem?: number;
}) {
  const novo = !modalidade;

  return (
    <div
      className={`grid gap-3 border p-3 md:grid-cols-[1fr_100px_90px_90px_70px_auto] md:items-center ${
        novo ? "border-dashed border-asfalto/25" : "border-asfalto/15"
      }`}
    >
      <form
        action={salvarModalidade}
        className="contents"
        id={`modalidade-${modalidade?.id ?? "novo"}`}
      >
        <input type="hidden" name="eventoId" value={eventoId} />
        {modalidade && <input type="hidden" name="id" value={modalidade.id} />}

        <Entrada nome="nome" rotulo="Nome" valor={modalidade?.nome} placeholder="10 km" obrigatorio />
        <Entrada
          nome="distanciaKm"
          rotulo="Distância (km)"
          valor={modalidade?.distanciaKm != null ? String(modalidade.distanciaKm) : ""}
          placeholder="10"
          inputMode="decimal"
        />
        <Entrada
          nome="idadeMinima"
          rotulo="Idade mínima"
          tipo="number"
          valor={modalidade?.idadeMinima ?? 0}
        />
        <Entrada
          nome="limiteVagas"
          rotulo="Vagas"
          tipo="number"
          valor={modalidade?.limiteVagas}
          placeholder="—"
        />
        <Entrada
          nome="ordem"
          rotulo="Ordem"
          tipo="number"
          valor={modalidade?.ordem ?? proximaOrdem}
        />

        <button
          type="submit"
          className="acao min-h-11 cursor-pointer rounded-[4px] border border-azul px-4 text-sm font-semibold text-azul hover:bg-azul hover:text-white"
        >
          {novo ? "Adicionar" : "Salvar"}
        </button>
      </form>

      {modalidade && (
        <form action={excluirModalidade} className="md:col-span-full md:justify-self-end">
          <input type="hidden" name="id" value={modalidade.id} />
          <input type="hidden" name="eventoId" value={eventoId} />
          <button
            type="submit"
            disabled={emUso}
            title={emUso ? "Já existem inscrições nesta modalidade." : undefined}
            className="acao cursor-pointer text-xs text-traco underline underline-offset-4 hover:text-erro disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {emUso ? "Não dá para excluir: já tem inscritos" : "Excluir modalidade"}
          </button>
        </form>
      )}
    </div>
  );
}

function LinhaLote({
  eventoId,
  lote,
  emUso = false,
  proximaOrdem = 0,
}: {
  eventoId: string;
  lote?: Lote;
  emUso?: boolean;
  proximaOrdem?: number;
}) {
  const novo = !lote;

  return (
    <div
      className={`grid gap-3 border p-3 lg:grid-cols-[1fr_100px_170px_170px_80px_70px_60px_auto] lg:items-center ${
        novo ? "border-dashed border-asfalto/25" : "border-asfalto/15"
      }`}
    >
      <form action={salvarLote} className="contents">
        <input type="hidden" name="eventoId" value={eventoId} />
        {lote && <input type="hidden" name="id" value={lote.id} />}

        <Entrada nome="nome" rotulo="Nome" valor={lote?.nome} placeholder="1º lote" obrigatorio ocultarEm="lg" />
        <Entrada
          ocultarEm="lg"
          nome="preco"
          rotulo="Preço (R$)"
          valor={lote ? paraCampoPreco(lote.precoCentavos) : ""}
          placeholder="60,00"
          inputMode="decimal"
          obrigatorio
        />
        <Entrada
          ocultarEm="lg"
          nome="inicioEm"
          rotulo="Início"
          tipo="datetime-local"
          valor={paraCampoDataHora(lote?.inicioEm)}
        />
        <Entrada
          ocultarEm="lg"
          nome="fimEm"
          rotulo="Fim"
          tipo="datetime-local"
          valor={paraCampoDataHora(lote?.fimEm)}
        />
        <Entrada nome="limiteVagas" rotulo="Vagas" tipo="number" valor={lote?.limiteVagas} placeholder="—" ocultarEm="lg" />
        <Entrada nome="ordem" rotulo="Ordem" tipo="number" valor={lote?.ordem ?? proximaOrdem} ocultarEm="lg" />

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={lote?.ativo ?? true}
            className="size-4 accent-azul"
          />
          <span className="lg:sr-only">Ativo</span>
        </label>

        <button
          type="submit"
          className="acao min-h-11 cursor-pointer rounded-[4px] border border-azul px-4 text-sm font-semibold text-azul hover:bg-azul hover:text-white"
        >
          {novo ? "Adicionar" : "Salvar"}
        </button>
      </form>

      {lote && (
        <form action={excluirLote} className="lg:col-span-full lg:justify-self-end">
          <input type="hidden" name="id" value={lote.id} />
          <input type="hidden" name="eventoId" value={eventoId} />
          <button
            type="submit"
            disabled={emUso}
            title={emUso ? "Já existem inscrições neste lote." : undefined}
            className="acao cursor-pointer text-xs text-traco underline underline-offset-4 hover:text-erro disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {emUso ? "Não dá para excluir: já tem inscritos" : "Excluir lote"}
          </button>
        </form>
      )}
    </div>
  );
}

function Entrada({
  nome,
  rotulo,
  valor,
  tipo = "text",
  placeholder,
  obrigatorio = false,
  inputMode,
  ocultarEm = "md",
}: {
  nome: string;
  rotulo: string;
  valor?: string | number | null;
  tipo?: string;
  placeholder?: string;
  obrigatorio?: boolean;
  inputMode?: "decimal" | "numeric";
  ocultarEm?: "md" | "lg";
}) {
  return (
    <label className="block">
      <span
        className={`rotulo mb-1 block text-traco ${ocultarEm === "lg" ? "lg:hidden" : "md:hidden"}`}
      >
        {rotulo}
      </span>
      <input
        name={nome}
        type={tipo}
        required={obrigatorio}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={valor ?? ""}
        aria-label={rotulo}
        className={entradaAdmin}
      />
    </label>
  );
}
