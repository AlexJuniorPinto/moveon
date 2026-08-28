/**
 * Modo demonstração.
 *
 * Ligado só quando `MOVEON_DEMO=1`, que é como o build estático do GitHub Pages
 * roda. Nesse modo nada toca o banco: as leituras devolvem as provas de exemplo
 * daqui e o formulário não grava nada. Em produção `DEMO` é `false` e este
 * arquivo nunca é executado.
 */
import type { Evento, Lote, Modalidade } from "@prisma/client";
import type { CartaoEvento, DetalheEvento } from "./consultas";
import type { DadosOrganizador } from "./organizador";
import {
  estadoInscricoes,
  loteVigente,
  maiorDistancia,
  proximoLote,
  resumoModalidades,
  seloDoEvento,
  vagasRestantes,
} from "./regras";

export const DEMO = process.env.MOVEON_DEMO === "1";

const DIA = 86_400_000;
const daqui = (dias: number, hora = 7) => {
  const data = new Date(Date.now() + dias * DIA);
  data.setHours(hora, 0, 0, 0);
  return data;
};

export const DEMO_NUMERO = "MV-2026-CFO-0087";

type EspecificacaoModalidade = {
  nome: string;
  km: number;
  idadeMinima?: number;
  limiteVagas?: number;
};

type EspecificacaoLote = {
  nome: string;
  preco: number;
  inicioEmDias?: number;
  fimEmDias?: number;
};

type Especificacao = {
  slug: string;
  sigla: string;
  nome: string;
  subtitulo?: string;
  cidade: string;
  uf: string;
  local: string;
  endereco?: string;
  emDias: number;
  limiteVagas?: number;
  ocupadas: number;
  destaque?: boolean;
  descricao?: string;
  percurso?: string;
  kit?: string;
  largada?: string;
  retirada?: string;
  modalidades: EspecificacaoModalidade[];
  lotes: EspecificacaoLote[];
};

const PROVAS: Especificacao[] = [
  {
    slug: "corrida-do-fogo",
    sigla: "CFO",
    nome: "Corrida do Fogo",
    subtitulo: "A prova que abre o calendário da região.",
    cidade: "Formiga",
    uf: "MG",
    local: "Praça da Matriz",
    endereco: "Praça da Matriz, s/n — Centro",
    emDias: 23,
    limiteVagas: 400,
    ocupadas: 282,
    destaque: true,
    descricao:
      "Largada no centro da cidade e chegada na praça, com apoio de hidratação a cada 2,5 km e ambulância acompanhando o pelotão.\n\nÉ uma prova para todo mundo: quem corre há anos e quem vai fazer os primeiros 5 km da vida.",
    percurso: "Plano, todo no asfalto, com fechamento total das ruas e apoio da guarda municipal.",
    kit: "Camisa da prova, número de peito com chip descartável, sacola e medalha na chegada.",
    largada: "7h — concentração a partir das 6h15",
    retirada: "Sexta-feira, das 14h às 20h, na sede da organização",
    modalidades: [
      { nome: "Caminhada 3 km", km: 3 },
      { nome: "5 km", km: 5, idadeMinima: 12 },
      { nome: "10 km", km: 10, idadeMinima: 16, limiteVagas: 200 },
    ],
    lotes: [
      { nome: "1º lote", preco: 6000, fimEmDias: 7 },
      { nome: "2º lote", preco: 7500, inicioEmDias: 7, fimEmDias: 18 },
    ],
  },
  {
    slug: "meia-da-serra",
    sigla: "MDS",
    nome: "Meia da Serra",
    subtitulo: "21 km subindo a serra, com a descida de brinde.",
    cidade: "Piumhi",
    uf: "MG",
    local: "Portal da Serra",
    emDias: 48,
    limiteVagas: 300,
    ocupadas: 286,
    descricao:
      "A prova mais dura do calendário: 340 metros de altimetria acumulada entre o km 6 e o km 14.",
    percurso: "Asfalto e estrada de terra compactada, com dois postos de hidratação na subida.",
    kit: "Camisa técnica, número de peito, viseira e medalha.",
    largada: "6h30 — o corte é às 9h30",
    retirada: "Sábado, das 9h às 17h, no Portal da Serra",
    modalidades: [
      { nome: "5 km", km: 5, idadeMinima: 14 },
      { nome: "10 km", km: 10, idadeMinima: 16 },
      { nome: "21 km", km: 21, idadeMinima: 18, limiteVagas: 120 },
    ],
    lotes: [{ nome: "Lote único", preco: 9000, fimEmDias: 40 }],
  },
  {
    slug: "noturna-das-aguas",
    sigla: "NDA",
    nome: "Noturna das Águas",
    subtitulo: "Largada às 19h, com a cidade fechada só para a prova.",
    cidade: "Arcos",
    uf: "MG",
    local: "Parque Municipal",
    emDias: 61,
    ocupadas: 94,
    descricao: "Percurso iluminado à beira do rio, com música em três pontos do trajeto.",
    percurso: "Circuito de 4 km repetido, plano e todo asfaltado.",
    kit: "Camisa refletiva, número de peito, pulseira de LED e medalha.",
    largada: "19h",
    retirada: "No dia, a partir das 16h, no Parque Municipal",
    modalidades: [
      { nome: "5 km", km: 5, idadeMinima: 12 },
      { nome: "8 km", km: 8, idadeMinima: 14 },
    ],
    lotes: [
      { nome: "1º lote", preco: 7000, fimEmDias: 3 },
      { nome: "2º lote", preco: 8500, inicioEmDias: 3, fimEmDias: 55 },
    ],
  },
  {
    slug: "circuito-do-lago",
    sigla: "CDL",
    nome: "Circuito do Lago",
    cidade: "Lagoa da Prata",
    uf: "MG",
    local: "Orla do Lago",
    emDias: 90,
    ocupadas: 41,
    descricao: "Uma volta completa no lago, com o sol nascendo no km 8.",
    percurso: "Ciclovia e asfalto, sem trecho de terra.",
    kit: "Camisa da prova, número de peito e medalha.",
    largada: "6h45",
    retirada: "Sábado, das 10h às 18h, na orla",
    modalidades: [
      { nome: "Caminhada 4 km", km: 4 },
      { nome: "12 km", km: 12, idadeMinima: 16 },
    ],
    lotes: [{ nome: "1º lote", preco: 5500, fimEmDias: 60 }],
  },
  {
    slug: "corrida-da-colheita",
    sigla: "CDC",
    nome: "Corrida da Colheita",
    cidade: "Bambuí",
    uf: "MG",
    local: "Parque de Exposições",
    emDias: 120,
    limiteVagas: 250,
    ocupadas: 250,
    descricao: "A prova de encerramento do calendário, dentro da festa da colheita.",
    percurso: "Ruas do centro e entrada do parque, todo plano.",
    kit: "Camisa, número de peito, medalha e ingresso da festa.",
    largada: "7h30",
    retirada: "Sexta e sábado, das 13h às 19h, no parque",
    modalidades: [
      { nome: "5 km", km: 5, idadeMinima: 12 },
      { nome: "10 km", km: 10, idadeMinima: 16 },
    ],
    lotes: [{ nome: "Lote único", preco: 6500, fimEmDias: 110 }],
  },
];

export const DEMO_ORGANIZADOR: DadosOrganizador = {
  id: "demo-organizador",
  nome: "Organização Passo Firme",
  whatsapp: "+5537999998888",
  instagram: "@passofirme.corridas",
  chavePix: null,
  tipoChavePix: null,
};

// ---------- montagem ----------

function montaEvento(spec: Especificacao): Evento & { modalidades: Modalidade[]; lotes: Lote[] } {
  const dataEvento = daqui(spec.emDias);

  const modalidades: Modalidade[] = spec.modalidades.map((m, indice) => ({
    id: `${spec.slug}-m${indice}`,
    eventoId: spec.slug,
    nome: m.nome,
    distanciaKm: m.km as unknown as Modalidade["distanciaKm"],
    idadeMinima: m.idadeMinima ?? 0,
    limiteVagas: m.limiteVagas ?? null,
    ordem: indice,
  }));

  const lotes: Lote[] = spec.lotes.map((l, indice) => ({
    id: `${spec.slug}-l${indice}`,
    eventoId: spec.slug,
    nome: l.nome,
    precoCentavos: l.preco,
    inicioEm: l.inicioEmDias != null ? daqui(l.inicioEmDias) : null,
    fimEm: l.fimEmDias != null ? daqui(l.fimEmDias) : null,
    limiteVagas: null,
    ordem: indice,
    ativo: true,
  }));

  const agora = new Date();

  return {
    id: spec.slug,
    organizadorId: DEMO_ORGANIZADOR.id,
    slug: spec.slug,
    sigla: spec.sigla,
    nome: spec.nome,
    subtitulo: spec.subtitulo ?? null,
    descricao: spec.descricao ?? null,
    percurso: spec.percurso ?? null,
    kit: spec.kit ?? null,
    horarioLargada: spec.largada ?? null,
    retiradaKit: spec.retirada ?? null,
    dataEvento,
    localNome: spec.local,
    cidade: spec.cidade,
    uf: spec.uf,
    endereco: spec.endereco ?? null,
    imagemCapaUrl: null,
    regulamentoUrl: null,
    inscricoesAbremEm: null,
    inscricoesFechamEm: daqui(Math.max(1, spec.emDias - 5)),
    limiteVagas: spec.limiteVagas ?? null,
    status: "publicado",
    destaque: spec.destaque ?? false,
    aceitaPix: true,
    aceitaDinheiro: true,
    proximoNumero: 86,
    createdAt: agora,
    updatedAt: agora,
    deletedAt: null,
    modalidades,
    lotes,
  };
}

function detalhe(spec: Especificacao): DetalheEvento {
  const evento = montaEvento(spec);
  const agora = new Date();
  const lote = loteVigente(evento.lotes, {}, agora);
  const ocupadas = spec.ocupadas;

  // Distribui a ocupação entre as modalidades só para a demo ter números plausíveis.
  const porModalidade = evento.modalidades.map((m, indice) =>
    Math.round((ocupadas / evento.modalidades.length) * (indice === 0 ? 0.8 : 1.1))
  );

  return {
    evento,
    modalidades: evento.modalidades.map((m, indice) => {
      const vagas = vagasRestantes(m.limiteVagas, porModalidade[indice]);
      return { ...m, vagas, disponivel: vagas == null || vagas > 0 };
    }),
    lote,
    proximo: proximoLote(evento.lotes, lote),
    vagas: vagasRestantes(evento.limiteVagas, ocupadas),
    ocupadas,
    estado: estadoInscricoes(evento, ocupadas, lote != null, agora),
  };
}

export function demoVitrine(): CartaoEvento[] {
  const agora = new Date();

  return [...PROVAS]
    .sort((a, b) => Number(b.destaque ?? false) - Number(a.destaque ?? false) || a.emDias - b.emDias)
    .map((spec) => {
      const { evento, lote, vagas, estado } = detalhe(spec);

      return {
        slug: evento.slug,
        nome: evento.nome,
        subtitulo: evento.subtitulo,
        cidade: evento.cidade,
        uf: evento.uf,
        dataEvento: evento.dataEvento,
        imagemCapaUrl: null,
        resumoModalidades: resumoModalidades(evento.modalidades),
        maiorDistancia: maiorDistancia(evento.modalidades),
        precoCentavos: lote?.precoCentavos ?? null,
        vagas,
        selo: estado.aberto
          ? seloDoEvento(vagas, lote, agora)
          : { texto: estado.texto, tom: "urgencia" as const },
        aberto: estado.aberto,
      };
    });
}

export function demoDetalhe(slug: string): DetalheEvento | null {
  const spec = PROVAS.find((p) => p.slug === slug);
  return spec ? detalhe(spec) : null;
}

export const DEMO_SLUGS = PROVAS.map((p) => p.slug);

/** A inscrição que a tela de confirmação mostra depois do envio simulado. */
export function demoInscricao(numero: string) {
  if (numero !== DEMO_NUMERO) return null;
  const { evento, lote } = detalhe(PROVAS[0]);

  return {
    numeroInscricao: DEMO_NUMERO,
    status: "pendente",
    nomeCompleto: "Ana Souza Lima",
    cpf: "52998224725",
    telefone: "+5537988887777",
    tamanhoCamisa: "M",
    modeloCamisa: "baby_look",
    equipe: "Assessoria Passo Firme",
    formaPagamento: "pix",
    valorCentavos: lote?.precoCentavos ?? 6000,
    evento,
    modalidade: evento.modalidades[2] ?? evento.modalidades[0],
    lote: lote ?? evento.lotes[0],
  };
}
