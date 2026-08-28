import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashSenha(senha: string): string {
  const sal = randomBytes(16).toString("hex");
  return `scrypt:${sal}:${scryptSync(senha, sal, 64).toString("hex")}`;
}

function daquiADias(dias: number, hora = 7): Date {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  data.setHours(hora, 0, 0, 0);
  return data;
}

async function main() {
  const email = (process.env.ORGANIZADOR_EMAIL ?? "organizador@exemplo.com.br").toLowerCase();
  const senha = process.env.ORGANIZADOR_SENHA ?? "moveon2026";

  const organizador = await prisma.organizador.upsert({
    where: { email },
    update: {},
    create: {
      email,
      senhaHash: hashSenha(senha),
      nome: process.env.ORGANIZADOR_NOME ?? "Organização MoveON",
      whatsapp: process.env.ORGANIZADOR_WHATSAPP ?? "+5537999999999",
      chavePix: process.env.ORGANIZADOR_CHAVE_PIX ?? null,
      tipoChavePix: process.env.ORGANIZADOR_TIPO_CHAVE_PIX ?? null,
      instagram: process.env.ORGANIZADOR_INSTAGRAM ?? null,
    },
  });

  console.log(`Organizador pronto: ${organizador.email}`);

  const slug = "corrida-do-fogo-exemplo";
  const jaExiste = await prisma.evento.findUnique({ where: { slug } });
  if (jaExiste) {
    console.log("Evento de exemplo já existe. Nada a fazer.");
    return;
  }

  const evento = await prisma.evento.create({
    data: {
      organizadorId: organizador.id,
      slug,
      sigla: "CFO",
      nome: "Corrida do Fogo",
      subtitulo: "A prova que abre o calendário da região.",
      descricao:
        "Uma prova de rua com largada no centro da cidade e chegada na praça, com apoio de hidratação a cada 2,5 km.\n\nÉ um evento para todo mundo: quem corre há anos e quem vai fazer os primeiros 5 km da vida.",
      percurso:
        "Percurso plano, todo no asfalto, com fechamento total das ruas e apoio da guarda municipal.",
      kit: "Camisa da prova, número de peito com chip descartável, sacola e medalha na chegada.",
      horarioLargada: "7h — concentração a partir das 6h15",
      retiradaKit: "Sexta-feira, das 14h às 20h, na sede da organização",
      dataEvento: daquiADias(75),
      localNome: "Praça da Matriz",
      cidade: "Formiga",
      uf: "MG",
      endereco: "Praça da Matriz, s/n — Centro",
      limiteVagas: 400,
      status: "publicado",
      destaque: true,
      aceitaPix: true,
      aceitaDinheiro: true,
      inscricoesFechamEm: daquiADias(70),
      modalidades: {
        create: [
          { nome: "Caminhada 3 km", distanciaKm: 3, idadeMinima: 0, ordem: 0 },
          { nome: "5 km", distanciaKm: 5, idadeMinima: 12, ordem: 1 },
          { nome: "10 km", distanciaKm: 10, idadeMinima: 16, limiteVagas: 200, ordem: 2 },
        ],
      },
      lotes: {
        create: [
          {
            nome: "1º lote",
            precoCentavos: 6000,
            fimEm: daquiADias(30),
            ordem: 0,
            ativo: true,
          },
          {
            nome: "2º lote",
            precoCentavos: 7500,
            inicioEm: daquiADias(30),
            fimEm: daquiADias(60),
            ordem: 1,
            ativo: true,
          },
          {
            nome: "3º lote",
            precoCentavos: 9000,
            inicioEm: daquiADias(60),
            fimEm: daquiADias(70),
            ordem: 2,
            ativo: true,
          },
        ],
      },
    },
  });

  console.log(`Evento de exemplo criado: /evento/${evento.slug}`);
  console.log(`\nEntre no painel em /admin/login com:\n  ${email}\n  ${senha}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
