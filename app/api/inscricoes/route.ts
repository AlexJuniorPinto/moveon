import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { esquemaInscricao } from "@/lib/schemas";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/rate-limit";
import {
  estadoInscricoes,
  formataNumeroInscricao,
  loteVigente,
  STATUS_QUE_OCUPAM_VAGA,
} from "@/lib/regras";
import { idadeNaData, paraE164 } from "@/lib/validacao";
import { formataMoeda } from "@/lib/formatos";

export const dynamic = "force-dynamic";

type Falha = { erro: string; mensagem: string; campo?: string; extra?: unknown };

const falha = (status: number, corpo: Falha) => NextResponse.json(corpo, { status });

export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao.headers);

  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return falha(400, { erro: "corpo_invalido", mensagem: "Requisição inválida." });
  }

  const analise = esquemaInscricao.safeParse(corpo);
  if (!analise.success) {
    const primeiro = analise.error.issues[0];
    return falha(422, {
      erro: "validacao",
      campo: String(primeiro?.path?.[0] ?? ""),
      mensagem: primeiro?.message ?? "Confira os dados do formulário.",
    });
  }

  const dados = analise.data;

  // Isca contra robô: o campo é invisível para gente. Respondemos 200 sem gravar
  // para não ensinar o robô a contornar.
  if (dados.sobrenomeDeSolteira) {
    return NextResponse.json({ numeroInscricao: "MV-0000-XXX-0000" }, { status: 200 });
  }

  if (!dentroDoLimite(`inscricao:${ip}`)) {
    return falha(429, {
      erro: "muitas_tentativas",
      mensagem:
        "Muitas inscrições enviadas deste aparelho. Espere alguns minutos ou fale com a organização.",
    });
  }

  const evento = await prisma.evento.findFirst({
    where: { slug: dados.eventoSlug, deletedAt: null },
    include: { modalidades: true, lotes: true },
  });
  if (!evento) {
    return falha(404, { erro: "evento_nao_encontrado", mensagem: "Prova não encontrada." });
  }

  const modalidade = evento.modalidades.find((m) => m.id === dados.modalidadeId);
  if (!modalidade) {
    return falha(422, {
      erro: "modalidade_invalida",
      campo: "modalidadeId",
      mensagem: "Escolha uma modalidade válida.",
    });
  }

  const agora = new Date();
  const ocupacao = await prisma.inscricao.groupBy({
    by: ["loteId"],
    where: { eventoId: evento.id, status: { in: STATUS_QUE_OCUPAM_VAGA } },
    _count: { _all: true },
  });
  const porLote: Record<string, number> = {};
  let ocupadasEvento = 0;
  for (const linha of ocupacao) {
    porLote[linha.loteId] = linha._count._all;
    ocupadasEvento += linha._count._all;
  }

  const lote = loteVigente(evento.lotes, porLote, agora);
  const estado = estadoInscricoes(evento, ocupadasEvento, lote != null, agora);
  if (!estado.aberto || !lote) {
    return falha(409, {
      erro: "inscricoes_fechadas",
      mensagem: `${estado.aberto ? "Inscrições encerradas" : estado.texto}. Fale com a organização no WhatsApp.`,
    });
  }

  // O preço é sempre o do servidor. Se o lote virou com o formulário aberto, o
  // participante reconfirma antes de gravar.
  if (lote.id !== dados.loteId) {
    return falha(409, {
      erro: "lote_mudou",
      mensagem: `O ${lote.nome} entrou em vigor e o valor agora é ${formataMoeda(lote.precoCentavos)}.`,
      extra: { loteId: lote.id, nome: lote.nome, precoCentavos: lote.precoCentavos },
    });
  }

  if (modalidade.idadeMinima > 0) {
    const idade = idadeNaData(new Date(`${dados.dataNascimento}T12:00:00`), evento.dataEvento);
    if (idade < modalidade.idadeMinima) {
      return falha(422, {
        erro: "idade_minima",
        campo: "modalidadeId",
        mensagem: `A modalidade ${modalidade.nome} é para ${modalidade.idadeMinima} anos ou mais.`,
      });
    }
  }

  const idadeNaProva = idadeNaData(
    new Date(`${dados.dataNascimento}T12:00:00`),
    evento.dataEvento
  );

  if (idadeNaProva < 18 && (!dados.responsavelNome || !dados.responsavelCpf)) {
    return falha(422, {
      erro: "responsavel_obrigatorio",
      campo: "responsavelNome",
      mensagem: "Menores de 18 anos precisam do nome e CPF do responsável.",
    });
  }

  if (
    (dados.formaPagamento === "pix" && !evento.aceitaPix) ||
    (dados.formaPagamento === "dinheiro" && !evento.aceitaDinheiro)
  ) {
    return falha(422, {
      erro: "pagamento_indisponivel",
      campo: "formaPagamento",
      mensagem: "Essa forma de pagamento não está disponível nesta prova.",
    });
  }

  const jaInscrito = await prisma.inscricao.findFirst({
    where: { eventoId: evento.id, cpf: dados.cpf },
    select: { id: true },
  });
  if (jaInscrito) {
    return falha(409, {
      erro: "cpf_duplicado",
      campo: "cpf",
      mensagem:
        "Este CPF já está inscrito nesta prova. Fale com a organização se precisar alterar algo.",
    });
  }

  try {
    const inscricao = await prisma.$transaction(async (tx) => {
      // O update com increment trava a linha do evento: dois envios simultâneos
      // não recebem o mesmo sequencial.
      const contador = await tx.evento.update({
        where: { id: evento.id },
        data: { proximoNumero: { increment: 1 } },
        select: { proximoNumero: true, sigla: true },
      });

      // Revalida vagas dentro da transação, com a contagem mais recente.
      if (evento.limiteVagas != null) {
        const total = await tx.inscricao.count({
          where: { eventoId: evento.id, status: { in: STATUS_QUE_OCUPAM_VAGA } },
        });
        if (total >= evento.limiteVagas) throw new Error("ESGOTADO");
      }
      if (modalidade.limiteVagas != null) {
        const total = await tx.inscricao.count({
          where: {
            eventoId: evento.id,
            modalidadeId: modalidade.id,
            status: { in: STATUS_QUE_OCUPAM_VAGA },
          },
        });
        if (total >= modalidade.limiteVagas) throw new Error("MODALIDADE_ESGOTADA");
      }
      if (lote.limiteVagas != null) {
        const total = await tx.inscricao.count({
          where: {
            eventoId: evento.id,
            loteId: lote.id,
            status: { in: STATUS_QUE_OCUPAM_VAGA },
          },
        });
        if (total >= lote.limiteVagas) throw new Error("LOTE_ESGOTADO");
      }

      return tx.inscricao.create({
        data: {
          eventoId: evento.id,
          modalidadeId: modalidade.id,
          loteId: lote.id,
          numeroInscricao: formataNumeroInscricao(
            evento.dataEvento.getFullYear(),
            contador.sigla,
            contador.proximoNumero
          ),
          nomeCompleto: dados.nomeCompleto,
          cpf: dados.cpf,
          dataNascimento: new Date(`${dados.dataNascimento}T12:00:00Z`),
          idade: idadeNaProva,
          sexo: dados.sexo,
          telefone: paraE164(dados.telefone),
          email: dados.email || null,
          tamanhoCamisa: dados.tamanhoCamisa,
          modeloCamisa: dados.modeloCamisa || null,
          equipe: dados.equipe || null,
          contatoEmergenciaNome: dados.contatoEmergenciaNome,
          contatoEmergenciaTelefone: paraE164(dados.contatoEmergenciaTelefone),
          responsavelNome: idadeNaProva < 18 ? (dados.responsavelNome ?? null) : null,
          responsavelCpf:
            idadeNaProva < 18 ? (dados.responsavelCpf?.replace(/\D/g, "") ?? null) : null,
          formaPagamento: dados.formaPagamento,
          valorCentavos: lote.precoCentavos,
          status: "pendente",
          aceiteRegulamento: true,
          aceiteLgpd: true,
          aceiteEm: agora,
          ipAceite: ip,
        },
        select: { numeroInscricao: true },
      });
    });

    return NextResponse.json({ numeroInscricao: inscricao.numeroInscricao }, { status: 201 });
  } catch (erro) {
    if (erro instanceof Error && erro.message === "ESGOTADO") {
      return falha(409, {
        erro: "esgotado",
        mensagem: "As vagas acabaram enquanto você preenchia. Fale com a organização.",
      });
    }
    if (erro instanceof Error && erro.message === "MODALIDADE_ESGOTADA") {
      return falha(409, {
        erro: "esgotado",
        campo: "modalidadeId",
        mensagem: "As vagas dessa modalidade acabaram. Escolha outra.",
      });
    }
    if (erro instanceof Error && erro.message === "LOTE_ESGOTADO") {
      return falha(409, {
        erro: "esgotado",
        mensagem: "As vagas deste lote acabaram. Recarregue a página para ver o novo valor.",
      });
    }
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return falha(409, {
        erro: "cpf_duplicado",
        campo: "cpf",
        mensagem:
          "Este CPF já está inscrito nesta prova. Fale com a organização se precisar alterar algo.",
      });
    }

    console.error("[moveon] falha ao gravar inscrição:", erro);
    return falha(500, {
      erro: "erro_interno",
      mensagem:
        "Não deu pra enviar sua inscrição. Tente de novo em alguns segundos ou fale com a organização no WhatsApp.",
    });
  }
}
