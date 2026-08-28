import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { organizadorDaSessao } from "@/lib/auth";
import { montaFiltro } from "@/lib/filtros-inscricao";
import { montaCsv, respostaCsv } from "@/lib/csv";
import { categoriaEtaria } from "@/lib/validacao";
import { dataHora, mascaraCpf, telefoneLegivel } from "@/lib/formatos";
import { STATUS_INSCRICAO } from "@/lib/regras";

export const dynamic = "force-dynamic";

const COLUNAS = [
  "Número",
  "Nome completo",
  "CPF",
  "Data de nascimento",
  "Idade na prova",
  "Categoria",
  "Sexo",
  "Telefone",
  "E-mail",
  "Modalidade",
  "Lote",
  "Valor",
  "Tamanho da camisa",
  "Modelo da camisa",
  "Equipe",
  "Contato de emergência",
  "Telefone de emergência",
  "Responsável",
  "CPF do responsável",
  "Forma de pagamento",
  "Status",
  "Aceitou o regulamento",
  "Autorizou os dados",
  "Data do aceite",
  "IP do aceite",
  "Observações",
  "Inscrição feita em",
  "Confirmada em",
];

const SEXO: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  nao_informar: "Não informado",
};

export async function GET(
  requisicao: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await organizadorDaSessao())) {
    return NextResponse.json({ erro: "nao_autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(requisicao.url);

  const evento = await prisma.evento.findFirst({
    where: { id, deletedAt: null },
    select: { slug: true, dataEvento: true },
  });
  if (!evento) return NextResponse.json({ erro: "nao_encontrado" }, { status: 404 });

  const inscricoes = await prisma.inscricao.findMany({
    where: montaFiltro(id, {
      status: url.searchParams.get("status") ?? undefined,
      modalidade: url.searchParams.get("modalidade") ?? undefined,
      lote: url.searchParams.get("lote") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    }),
    orderBy: { numeroInscricao: "asc" },
    include: { modalidade: true, lote: true },
  });

  const dataBr = (data: Date) =>
    data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const linhas = inscricoes.map((i) => [
    i.numeroInscricao,
    i.nomeCompleto,
    mascaraCpf(i.cpf),
    dataBr(i.dataNascimento),
    i.idade,
    categoriaEtaria(i.dataNascimento, evento.dataEvento),
    SEXO[i.sexo] ?? i.sexo,
    telefoneLegivel(i.telefone),
    i.email ?? "",
    i.modalidade.nome,
    i.lote.nome,
    (i.valorCentavos / 100).toFixed(2).replace(".", ","),
    i.tamanhoCamisa,
    i.modeloCamisa === "baby_look" ? "Baby look" : i.modeloCamisa === "masculina" ? "Masculina" : "",
    i.equipe ?? "",
    i.contatoEmergenciaNome,
    telefoneLegivel(i.contatoEmergenciaTelefone),
    i.responsavelNome ?? "",
    i.responsavelCpf ? mascaraCpf(i.responsavelCpf) : "",
    i.formaPagamento === "pix" ? "Pix" : "Dinheiro na retirada do kit",
    STATUS_INSCRICAO[i.status as keyof typeof STATUS_INSCRICAO] ?? i.status,
    i.aceiteRegulamento ? "Sim" : "Não",
    i.aceiteLgpd ? "Sim" : "Não",
    i.aceiteEm ? dataHora(i.aceiteEm) : "",
    i.ipAceite ?? "",
    i.observacoesAdmin ?? "",
    dataHora(i.createdAt),
    i.confirmadaEm ? dataHora(i.confirmadaEm) : "",
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  return respostaCsv(montaCsv(COLUNAS, linhas), `inscritos-${evento.slug}-${hoje}.csv`);
}
