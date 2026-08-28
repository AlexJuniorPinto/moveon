import { z } from "zod";
import {
  apenasDigitos,
  nomeCompletoValido,
  validaCpf,
  validaTelefone,
  TAMANHOS_CAMISA,
} from "./validacao";

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);

export const esquemaInscricao = z.object({
  eventoSlug: texto(1, 120),
  modalidadeId: z.uuid(),
  loteId: z.uuid(),

  nomeCompleto: texto(5, 120).refine(nomeCompletoValido, "Informe o nome completo."),
  cpf: z.string().transform(apenasDigitos).refine(validaCpf, "CPF inválido."),
  dataNascimento: z.iso.date(),
  sexo: z.enum(["masculino", "feminino", "nao_informar"]),
  telefone: z
    .string()
    .transform(apenasDigitos)
    .refine(validaTelefone, "Telefone inválido."),
  email: z.union([z.email(), z.literal("")]).optional(),

  tamanhoCamisa: z.enum(TAMANHOS_CAMISA),
  modeloCamisa: z.union([z.enum(["masculina", "baby_look"]), z.literal("")]).optional(),
  equipe: z.string().trim().max(80).optional(),

  contatoEmergenciaNome: texto(3, 120),
  contatoEmergenciaTelefone: z
    .string()
    .transform(apenasDigitos)
    .refine(validaTelefone, "Telefone de emergência inválido."),

  responsavelNome: z.string().trim().max(120).optional(),
  responsavelCpf: z.string().optional(),

  formaPagamento: z.enum(["pix", "dinheiro"]),

  aceiteRegulamento: z.literal(true, "É preciso aceitar o regulamento."),
  aceiteLgpd: z.literal(true, "É preciso autorizar o uso dos dados."),

  // Campo isca: preenchido só por robô. Humano nunca vê.
  sobrenomeDeSolteira: z.string().max(0).optional(),
});

export type EntradaInscricao = z.infer<typeof esquemaInscricao>;

export const esquemaLogin = z.object({
  email: z.email("E-mail inválido."),
  senha: z.string().min(8, "A senha tem no mínimo 8 caracteres."),
});
