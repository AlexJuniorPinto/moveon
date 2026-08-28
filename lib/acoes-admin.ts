"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { abrirSessao, fecharSessao, hashSenha, organizadorDaSessao, verificaSenha } from "./auth";
import { esquemaLogin } from "./schemas";
import { paraE164 } from "./validacao";

export type Resultado = { erro?: string; ok?: string };

async function exigeOrganizador(): Promise<string> {
  const id = await organizadorDaSessao();
  if (!id) redirect("/admin/login");
  return id;
}

// ---------- texto ----------

/** "Corrida do Fogo 2026" -> "corrida-do-fogo-2026" */
function paraSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * datetime-local não carrega fuso. O Brasil não tem mais horário de verão, então
 * -03:00 vale o ano inteiro em America/Sao_Paulo.
 */
function paraData(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const completo = texto.length === 16 ? `${texto}:00` : texto;
  const data = new Date(`${completo}-03:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function texto(dados: FormData, campo: string): string {
  return String(dados.get(campo) ?? "").trim();
}

function opcional(dados: FormData, campo: string): string | null {
  const valor = texto(dados, campo);
  return valor === "" ? null : valor;
}

function inteiro(dados: FormData, campo: string): number | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const numero = Number.parseInt(valor.replace(/\D/g, ""), 10);
  return Number.isFinite(numero) ? numero : null;
}

/** "60,00" ou "60" -> 6000 centavos */
function centavos(dados: FormData, campo: string): number {
  const valor = texto(dados, campo).replace(/[^\d,.-]/g, "").replace(",", ".");
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

// ---------- sessão ----------

export async function entrar(_anterior: Resultado, dados: FormData): Promise<Resultado> {
  const analise = esquemaLogin.safeParse({
    email: texto(dados, "email").toLowerCase(),
    senha: String(dados.get("senha") ?? ""),
  });
  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Confira e-mail e senha." };
  }

  const organizador = await prisma.organizador
    .findUnique({ where: { email: analise.data.email } })
    .catch(() => null);

  // Mensagem única para não revelar quais e-mails existem.
  if (!organizador || !verificaSenha(analise.data.senha, organizador.senhaHash)) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await abrirSessao(organizador.id);
  redirect("/admin");
}

export async function sair(): Promise<void> {
  await fecharSessao();
  redirect("/admin/login");
}

// ---------- eventos ----------

function dadosDoEvento(dados: FormData) {
  return {
    nome: texto(dados, "nome"),
    subtitulo: opcional(dados, "subtitulo"),
    descricao: opcional(dados, "descricao"),
    percurso: opcional(dados, "percurso"),
    kit: opcional(dados, "kit"),
    horarioLargada: opcional(dados, "horarioLargada"),
    retiradaKit: opcional(dados, "retiradaKit"),
    localNome: texto(dados, "localNome"),
    cidade: texto(dados, "cidade"),
    uf: texto(dados, "uf").toUpperCase().slice(0, 2),
    endereco: opcional(dados, "endereco"),
    imagemCapaUrl: opcional(dados, "imagemCapaUrl"),
    regulamentoUrl: opcional(dados, "regulamentoUrl"),
    limiteVagas: inteiro(dados, "limiteVagas"),
    destaque: dados.get("destaque") === "on",
    aceitaPix: dados.get("aceitaPix") === "on",
    aceitaDinheiro: dados.get("aceitaDinheiro") === "on",
  };
}

export async function criarEvento(_anterior: Resultado, dados: FormData): Promise<Resultado> {
  const organizadorId = await exigeOrganizador();
  const base = dadosDoEvento(dados);
  const dataEvento = paraData(dados.get("dataEvento"));

  if (!base.nome || !base.localNome || !base.cidade || !base.uf || !dataEvento) {
    return { erro: "Preencha nome, data, local, cidade e UF." };
  }

  const sigla = (texto(dados, "sigla") || base.nome.replace(/[^A-Za-zÀ-ÿ ]/g, ""))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .map((palavra) => palavra[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 3);

  let evento;
  try {
    evento = await prisma.evento.create({
      data: {
        ...base,
        organizadorId,
        dataEvento,
        sigla: sigla || "MVN",
        slug: paraSlug(texto(dados, "slug") || base.nome),
        inscricoesAbremEm: paraData(dados.get("inscricoesAbremEm")),
        inscricoesFechamEm: paraData(dados.get("inscricoesFechamEm")),
        status: "rascunho",
      },
      select: { id: true },
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return { erro: "Já existe uma prova com esse endereço (slug). Escolha outro." };
    }
    console.error("[moveon] falha ao criar evento:", erro);
    return { erro: "Não deu pra criar a prova. Tente de novo." };
  }

  revalidatePath("/admin/eventos");
  redirect(`/admin/eventos/${evento.id}`);
}

export async function atualizarEvento(_anterior: Resultado, dados: FormData): Promise<Resultado> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  const base = dadosDoEvento(dados);
  const dataEvento = paraData(dados.get("dataEvento"));

  if (!id || !base.nome || !dataEvento) return { erro: "Preencha nome e data da prova." };

  try {
    const evento = await prisma.evento.update({
      where: { id },
      data: {
        ...base,
        dataEvento,
        slug: paraSlug(texto(dados, "slug") || base.nome),
        inscricoesAbremEm: paraData(dados.get("inscricoesAbremEm")),
        inscricoesFechamEm: paraData(dados.get("inscricoesFechamEm")),
      },
      select: { slug: true },
    });
    revalidatePath("/");
    revalidatePath(`/evento/${evento.slug}`);
    revalidatePath(`/admin/eventos/${id}`);
    return { ok: "Prova salva." };
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return { erro: "Já existe uma prova com esse endereço (slug). Escolha outro." };
    }
    console.error("[moveon] falha ao salvar evento:", erro);
    return { erro: "Não deu pra salvar. Tente de novo." };
  }
}

export async function mudarStatusEvento(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  const status = texto(dados, "status");
  if (!["rascunho", "publicado", "encerrado", "cancelado"].includes(status)) return;

  const evento = await prisma.evento.findUnique({ where: { id }, select: { slug: true } });
  await prisma.evento.update({ where: { id }, data: { status } });

  revalidatePath("/");
  if (evento) revalidatePath(`/evento/${evento.slug}`);
  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${id}`);
}

export async function arquivarEvento(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  await prisma.evento.update({
    where: { id },
    data: { deletedAt: new Date(), status: "cancelado" },
  });
  revalidatePath("/");
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos");
}

// ---------- modalidades ----------

export async function salvarModalidade(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = opcional(dados, "id");
  const eventoId = texto(dados, "eventoId");
  const nome = texto(dados, "nome");
  if (!eventoId || !nome) return;

  const distancia = texto(dados, "distanciaKm").replace(",", ".");
  const valores = {
    nome,
    distanciaKm: distancia ? new Prisma.Decimal(distancia) : null,
    idadeMinima: inteiro(dados, "idadeMinima") ?? 0,
    limiteVagas: inteiro(dados, "limiteVagas"),
    ordem: inteiro(dados, "ordem") ?? 0,
  };

  if (id) await prisma.modalidade.update({ where: { id }, data: valores });
  else await prisma.modalidade.create({ data: { ...valores, eventoId } });

  revalidatePath("/");
  revalidatePath(`/admin/eventos/${eventoId}`);
}

export async function excluirModalidade(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  const eventoId = texto(dados, "eventoId");

  const emUso = await prisma.inscricao.count({ where: { modalidadeId: id } });
  if (emUso === 0) await prisma.modalidade.delete({ where: { id } });

  revalidatePath(`/admin/eventos/${eventoId}`);
}

// ---------- lotes ----------

export async function salvarLote(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = opcional(dados, "id");
  const eventoId = texto(dados, "eventoId");
  const nome = texto(dados, "nome");
  if (!eventoId || !nome) return;

  const valores = {
    nome,
    precoCentavos: centavos(dados, "preco"),
    inicioEm: paraData(dados.get("inicioEm")),
    fimEm: paraData(dados.get("fimEm")),
    limiteVagas: inteiro(dados, "limiteVagas"),
    ordem: inteiro(dados, "ordem") ?? 0,
    ativo: dados.get("ativo") === "on",
  };

  if (id) await prisma.lote.update({ where: { id }, data: valores });
  else await prisma.lote.create({ data: { ...valores, eventoId } });

  revalidatePath("/");
  revalidatePath(`/admin/eventos/${eventoId}`);
}

export async function excluirLote(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  const eventoId = texto(dados, "eventoId");

  const emUso = await prisma.inscricao.count({ where: { loteId: id } });
  if (emUso === 0) await prisma.lote.delete({ where: { id } });

  revalidatePath(`/admin/eventos/${eventoId}`);
}

// ---------- inscrições ----------

export async function mudarStatusInscricoes(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const eventoId = texto(dados, "eventoId");
  const status = texto(dados, "status");
  const ids = dados.getAll("ids").map(String).filter(Boolean);
  const unico = opcional(dados, "id");
  const alvos = unico ? [unico] : ids;

  if (alvos.length === 0 || !["confirmada", "cancelada", "pendente"].includes(status)) return;

  await prisma.inscricao.updateMany({
    where: { id: { in: alvos } },
    data: {
      status,
      confirmadaEm: status === "confirmada" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/admin/eventos/${eventoId}/inscritos`);
  revalidatePath("/admin");
}

export async function anotarInscricao(dados: FormData): Promise<void> {
  await exigeOrganizador();
  const id = texto(dados, "id");
  const eventoId = texto(dados, "eventoId");
  await prisma.inscricao.update({
    where: { id },
    data: { observacoesAdmin: opcional(dados, "observacoesAdmin") },
  });
  revalidatePath(`/admin/eventos/${eventoId}/inscritos`);
}

// ---------- configurações ----------

export async function salvarConfiguracoes(
  _anterior: Resultado,
  dados: FormData
): Promise<Resultado> {
  const organizadorId = await exigeOrganizador();

  const whatsapp = texto(dados, "whatsapp");
  if (whatsapp.replace(/\D/g, "").length < 10) {
    return { erro: "Informe o WhatsApp com DDD." };
  }

  const senha = String(dados.get("senha") ?? "");
  if (senha && senha.length < 8) {
    return { erro: "A nova senha precisa ter no mínimo 8 caracteres." };
  }

  await prisma.organizador.update({
    where: { id: organizadorId },
    data: {
      nome: texto(dados, "nome"),
      whatsapp: paraE164(whatsapp),
      instagram: opcional(dados, "instagram"),
      chavePix: opcional(dados, "chavePix"),
      tipoChavePix: opcional(dados, "tipoChavePix"),
      logoUrl: opcional(dados, "logoUrl"),
      ...(senha ? { senhaHash: hashSenha(senha) } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes");
  return { ok: senha ? "Dados e senha salvos." : "Dados salvos." };
}
