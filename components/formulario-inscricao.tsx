"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/botao";
import { Campo, Grupo, entrada } from "@/components/ui/campos";
import { IconeAlerta, IconeWhatsapp } from "@/components/icones";
import { formataMoeda, mascaraCpf, mascaraTelefone } from "@/lib/formatos";
import {
  capitalizaNome,
  idadeNaData,
  nomeCompletoValido,
  validaCpf,
  validaTelefone,
  MODELOS_CAMISA,
  SEXOS,
  TAMANHOS_CAMISA,
} from "@/lib/validacao";

export type ModalidadeFormulario = {
  id: string;
  nome: string;
  idadeMinima: number;
  disponivel: boolean;
};

export type DadosFormulario = {
  slug: string;
  nomeEvento: string;
  dataEventoISO: string;
  regulamentoUrl: string | null;
  whatsappOrganizador: string | null;
  modalidades: ModalidadeFormulario[];
  lote: { id: string; nome: string; precoCentavos: number };
  formasPagamento: { valor: "pix" | "dinheiro"; rotulo: string }[];
};

type Valores = {
  modalidadeId: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  tamanhoCamisa: string;
  modeloCamisa: string;
  equipe: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  responsavelNome: string;
  responsavelCpf: string;
  formaPagamento: string;
  aceiteRegulamento: boolean;
  aceiteLgpd: boolean;
};

type Erros = Partial<Record<keyof Valores, string | null>>;

const VAZIO: Valores = {
  modalidadeId: "",
  nomeCompleto: "",
  cpf: "",
  dataNascimento: "",
  sexo: "",
  telefone: "",
  email: "",
  tamanhoCamisa: "",
  modeloCamisa: "",
  equipe: "",
  contatoEmergenciaNome: "",
  contatoEmergenciaTelefone: "",
  responsavelNome: "",
  responsavelCpf: "",
  formaPagamento: "",
  aceiteRegulamento: false,
  aceiteLgpd: false,
};

export function FormularioInscricao({ dados }: { dados: DadosFormulario }) {
  const router = useRouter();
  const chaveRascunho = `moveon:rascunho:${dados.slug}`;
  const formRef = useRef<HTMLFormElement>(null);
  const iscaRef = useRef<HTMLInputElement>(null);

  const [valores, setValores] = useState<Valores>(() => ({
    ...VAZIO,
    formaPagamento: dados.formasPagamento.length === 1 ? dados.formasPagamento[0].valor : "",
  }));
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [avisoGeral, setAvisoGeral] = useState<{
    tipo: "erro" | "lote";
    mensagem: string;
    lote?: { id: string; nome: string; precoCentavos: number };
  } | null>(null);
  const [lote, setLote] = useState(dados.lote);

  const dataEvento = useMemo(() => new Date(dados.dataEventoISO), [dados.dataEventoISO]);

  const idadeNaProva = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.dataNascimento)) return null;
    const nascimento = new Date(`${valores.dataNascimento}T12:00:00`);
    if (Number.isNaN(nascimento.getTime())) return null;
    const idade = idadeNaData(nascimento, dataEvento);
    return idade >= 0 && idade < 120 ? idade : null;
  }, [valores.dataNascimento, dataEvento]);

  const menorDeIdade = idadeNaProva != null && idadeNaProva < 18;

  const modalidadesExibidas = useMemo(
    () =>
      dados.modalidades.map((modalidade) => {
        if (!modalidade.disponivel) return { ...modalidade, bloqueio: "esgotada" as const };
        if (idadeNaProva != null && idadeNaProva < modalidade.idadeMinima)
          return { ...modalidade, bloqueio: "idade" as const };
        return { ...modalidade, bloqueio: null };
      }),
    [dados.modalidades, idadeNaProva]
  );

  const modalidadeEscolhida = dados.modalidades.find((m) => m.id === valores.modalidadeId);

  // ---------- rascunho ----------

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveRascunho);
      if (salvo) setValores((atual) => ({ ...atual, ...JSON.parse(salvo) }));
    } catch {
      // rascunho corrompido não deve impedir a inscrição
    }
  }, [chaveRascunho]);

  useEffect(() => {
    try {
      localStorage.setItem(chaveRascunho, JSON.stringify(valores));
    } catch {
      // sem espaço ou modo privado: seguir sem rascunho
    }
  }, [valores, chaveRascunho]);

  // A modalidade escolhida pode deixar de valer quando a data de nascimento muda.
  useEffect(() => {
    if (!valores.modalidadeId) return;
    const atual = modalidadesExibidas.find((m) => m.id === valores.modalidadeId);
    if (atual?.bloqueio) {
      setValores((v) => ({ ...v, modalidadeId: "" }));
      setErros((e) => ({
        ...e,
        modalidadeId:
          atual.bloqueio === "idade"
            ? `A modalidade ${atual.nome} exige ${atual.idadeMinima} anos ou mais na data da prova.`
            : `A modalidade ${atual.nome} esgotou. Escolha outra.`,
      }));
    }
  }, [modalidadesExibidas, valores.modalidadeId]);

  // ---------- validação ----------

  function validaCampo(campo: keyof Valores, v: Valores = valores): string | null {
    switch (campo) {
      case "modalidadeId":
        return v.modalidadeId ? null : "Escolha a modalidade.";
      case "nomeCompleto":
        if (!v.nomeCompleto.trim()) return "Informe seu nome completo.";
        return nomeCompletoValido(v.nomeCompleto)
          ? null
          : "Escreva nome e sobrenome, como no documento.";
      case "cpf":
        if (!v.cpf.trim()) return "Informe seu CPF.";
        return validaCpf(v.cpf) ? null : "CPF inválido. Confira os números.";
      case "dataNascimento":
        if (!v.dataNascimento) return "Informe sua data de nascimento.";
        return idadeNaProva == null ? "Data de nascimento inválida." : null;
      case "sexo":
        return v.sexo ? null : "Escolha uma opção.";
      case "telefone":
        if (!v.telefone.trim()) return "Informe seu telefone com DDD.";
        return validaTelefone(v.telefone)
          ? null
          : "Telefone incompleto. Use DDD e o 9 na frente.";
      case "email":
        if (!v.email.trim()) return null;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())
          ? null
          : "E-mail inválido.";
      case "tamanhoCamisa":
        return v.tamanhoCamisa ? null : "Escolha o tamanho da camisa.";
      case "contatoEmergenciaNome":
        return v.contatoEmergenciaNome.trim().length >= 3
          ? null
          : "Informe quem podemos avisar em caso de emergência.";
      case "contatoEmergenciaTelefone":
        if (!v.contatoEmergenciaTelefone.trim()) return "Informe o telefone de emergência.";
        return validaTelefone(v.contatoEmergenciaTelefone)
          ? null
          : "Telefone incompleto. Use DDD e o 9 na frente.";
      case "responsavelNome":
        if (!menorDeIdade) return null;
        return nomeCompletoValido(v.responsavelNome)
          ? null
          : "Informe o nome completo do responsável.";
      case "responsavelCpf":
        if (!menorDeIdade) return null;
        return validaCpf(v.responsavelCpf) ? null : "CPF do responsável inválido.";
      case "formaPagamento":
        return v.formaPagamento ? null : "Escolha a forma de pagamento.";
      case "aceiteRegulamento":
        return v.aceiteRegulamento ? null : "É preciso aceitar o regulamento para continuar.";
      case "aceiteLgpd":
        return v.aceiteLgpd ? null : "É preciso autorizar o uso dos dados para continuar.";
      default:
        return null;
    }
  }

  const CAMPOS_VALIDADOS: (keyof Valores)[] = [
    "modalidadeId",
    "nomeCompleto",
    "cpf",
    "dataNascimento",
    "sexo",
    "telefone",
    "email",
    "tamanhoCamisa",
    "contatoEmergenciaNome",
    "contatoEmergenciaTelefone",
    "responsavelNome",
    "responsavelCpf",
    "formaPagamento",
    "aceiteRegulamento",
    "aceiteLgpd",
  ];

  function altera<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atual) => {
      const proximo = { ...atual, [campo]: valor };
      // Erro visível some assim que o campo fica válido — não espera o blur.
      if (erros[campo] && !validaCampo(campo, proximo)) {
        setErros((e) => ({ ...e, [campo]: null }));
      }
      return proximo;
    });
  }

  function aoSair(campo: keyof Valores) {
    setErros((e) => ({ ...e, [campo]: validaCampo(campo) }));
  }

  const temErroVisivel = CAMPOS_VALIDADOS.some((campo) => Boolean(erros[campo]));

  // ---------- envio ----------

  async function enviar(loteEmVigor = lote) {
    const novosErros: Erros = {};
    for (const campo of CAMPOS_VALIDADOS) novosErros[campo] = validaCampo(campo);
    setErros(novosErros);

    const primeiroInvalido = CAMPOS_VALIDADOS.find((campo) => novosErros[campo]);
    if (primeiroInvalido) {
      setAvisoGeral(null);
      const alvo = formRef.current?.querySelector<HTMLElement>(`[name="${primeiroInvalido}"]`);
      alvo?.focus();
      alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setEnviando(true);
    setAvisoGeral(null);

    try {
      const resposta = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoSlug: dados.slug,
          modalidadeId: valores.modalidadeId,
          loteId: loteEmVigor.id,
          nomeCompleto: capitalizaNome(valores.nomeCompleto.trim()),
          cpf: valores.cpf,
          dataNascimento: valores.dataNascimento,
          sexo: valores.sexo,
          telefone: valores.telefone,
          email: valores.email.trim(),
          tamanhoCamisa: valores.tamanhoCamisa,
          modeloCamisa: valores.modeloCamisa,
          equipe: valores.equipe.trim(),
          contatoEmergenciaNome: valores.contatoEmergenciaNome.trim(),
          contatoEmergenciaTelefone: valores.contatoEmergenciaTelefone,
          responsavelNome: menorDeIdade ? valores.responsavelNome.trim() : "",
          responsavelCpf: menorDeIdade ? valores.responsavelCpf : "",
          formaPagamento: valores.formaPagamento,
          aceiteRegulamento: valores.aceiteRegulamento,
          aceiteLgpd: valores.aceiteLgpd,
          sobrenomeDeSolteira: iscaRef.current?.value ?? "",
        }),
      });

      const corpo = await resposta.json().catch(() => null);

      if (resposta.ok && corpo?.numeroInscricao) {
        try {
          localStorage.removeItem(chaveRascunho);
        } catch {
          // ignorar
        }
        router.push(`/inscricao/${corpo.numeroInscricao}`);
        return;
      }

      if (corpo?.erro === "lote_mudou" && corpo.extra) {
        setAvisoGeral({ tipo: "lote", mensagem: corpo.mensagem, lote: corpo.extra });
        setEnviando(false);
        return;
      }

      if (corpo?.campo) {
        setErros((e) => ({ ...e, [corpo.campo as keyof Valores]: corpo.mensagem }));
        const alvo = formRef.current?.querySelector<HTMLElement>(`[name="${corpo.campo}"]`);
        alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      setAvisoGeral({
        tipo: "erro",
        mensagem:
          corpo?.mensagem ??
          "Não deu pra enviar sua inscrição. Tente de novo em alguns segundos ou fale com a organização no WhatsApp.",
      });
    } catch {
      setAvisoGeral({
        tipo: "erro",
        mensagem:
          "Não deu pra enviar sua inscrição. Confira sua conexão e tente de novo em alguns segundos.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px] md:gap-12">
      <Resumo
        nomeEvento={dados.nomeEvento}
        modalidade={modalidadeEscolhida?.nome ?? null}
        lote={lote}
      />

      <form
        ref={formRef}
        noValidate
        onSubmit={(evento) => {
          evento.preventDefault();
          if (!enviando) void enviar();
        }}
        className="flex flex-col gap-8 md:col-start-1 md:row-start-1"
      >
      {/* Isca contra robô — invisível e fora da ordem de tabulação. */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="sobrenomeDeSolteira">Não preencha este campo</label>
        <input
          ref={iscaRef}
          id="sobrenomeDeSolteira"
          name="sobrenomeDeSolteira"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <Grupo titulo="A prova">
        <Campo id="modalidadeId" rotulo="Modalidade" erro={erros.modalidadeId}>
          <select
            id="modalidadeId"
            name="modalidadeId"
            value={valores.modalidadeId}
            onChange={(e) => altera("modalidadeId", e.target.value)}
            onBlur={() => aoSair("modalidadeId")}
            aria-invalid={Boolean(erros.modalidadeId)}
            aria-describedby={erros.modalidadeId ? "modalidadeId-erro" : undefined}
            className={entrada(Boolean(erros.modalidadeId))}
          >
            <option value="">Escolha o percurso</option>
            {modalidadesExibidas.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id} disabled={Boolean(modalidade.bloqueio)}>
                {modalidade.nome}
                {modalidade.bloqueio === "esgotada" && " — esgotada"}
                {modalidade.bloqueio === "idade" &&
                  ` — a partir de ${modalidade.idadeMinima} anos`}
              </option>
            ))}
          </select>
        </Campo>
      </Grupo>

      <Grupo titulo="Seus dados">
        <Campo id="nomeCompleto" rotulo="Nome completo" erro={erros.nomeCompleto}>
          <input
            id="nomeCompleto"
            name="nomeCompleto"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            value={valores.nomeCompleto}
            onChange={(e) => altera("nomeCompleto", e.target.value)}
            onBlur={() => aoSair("nomeCompleto")}
            aria-invalid={Boolean(erros.nomeCompleto)}
            aria-describedby={erros.nomeCompleto ? "nomeCompleto-erro" : undefined}
            className={entrada(Boolean(erros.nomeCompleto))}
          />
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="cpf" rotulo="CPF" erro={erros.cpf}>
            <input
              id="cpf"
              name="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={mascaraCpf(valores.cpf)}
              onChange={(e) => altera("cpf", e.target.value.replace(/\D/g, "").slice(0, 11))}
              onBlur={() => aoSair("cpf")}
              aria-invalid={Boolean(erros.cpf)}
              aria-describedby={erros.cpf ? "cpf-erro" : undefined}
              className={`${entrada(Boolean(erros.cpf))} dados`}
            />
          </Campo>

          <Campo
            id="dataNascimento"
            rotulo="Data de nascimento"
            erro={erros.dataNascimento}
            dica={
              idadeNaProva != null
                ? `Você terá ${idadeNaProva} anos na data da prova.`
                : undefined
            }
          >
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              autoComplete="bday"
              min="1920-01-01"
              max={new Date().toISOString().slice(0, 10)}
              value={valores.dataNascimento}
              onChange={(e) => altera("dataNascimento", e.target.value)}
              onBlur={() => aoSair("dataNascimento")}
              aria-invalid={Boolean(erros.dataNascimento)}
              aria-describedby={
                erros.dataNascimento
                  ? "dataNascimento-erro"
                  : idadeNaProva != null
                    ? "dataNascimento-dica"
                    : undefined
              }
              className={`${entrada(Boolean(erros.dataNascimento))} dados`}
            />
          </Campo>
        </div>

        <Campo
          id="sexo"
          rotulo="Sexo"
          erro={erros.sexo}
          dica="Usado só para definir a categoria da premiação."
        >
          <div role="radiogroup" aria-label="Sexo" className="flex flex-col gap-2 sm:flex-row">
            {SEXOS.map((opcao) => (
              <OpcaoRadio
                key={opcao.valor}
                nome="sexo"
                valor={opcao.valor}
                rotulo={opcao.rotulo}
                marcado={valores.sexo === opcao.valor}
                aoMarcar={() => altera("sexo", opcao.valor)}
              />
            ))}
          </div>
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="telefone" rotulo="Telefone (WhatsApp)" erro={erros.telefone}>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              value={mascaraTelefone(valores.telefone)}
              onChange={(e) => altera("telefone", e.target.value.replace(/\D/g, "").slice(0, 11))}
              onBlur={() => aoSair("telefone")}
              aria-invalid={Boolean(erros.telefone)}
              aria-describedby={erros.telefone ? "telefone-erro" : undefined}
              className={`${entrada(Boolean(erros.telefone))} dados`}
            />
          </Campo>

          <Campo id="email" rotulo="E-mail" opcional erro={erros.email}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={valores.email}
              onChange={(e) => altera("email", e.target.value)}
              onBlur={() => aoSair("email")}
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? "email-erro" : undefined}
              className={entrada(Boolean(erros.email))}
            />
          </Campo>
        </div>
      </Grupo>

      {menorDeIdade && (
        <Grupo
          titulo="Responsável"
          descricao="Menores de 18 anos na data da prova precisam de um responsável. O termo de responsabilidade assinado deve ser entregue na retirada do kit."
        >
          <Campo id="responsavelNome" rotulo="Nome do responsável" erro={erros.responsavelNome}>
            <input
              id="responsavelNome"
              name="responsavelNome"
              type="text"
              autoCapitalize="words"
              value={valores.responsavelNome}
              onChange={(e) => altera("responsavelNome", e.target.value)}
              onBlur={() => aoSair("responsavelNome")}
              aria-invalid={Boolean(erros.responsavelNome)}
              aria-describedby={erros.responsavelNome ? "responsavelNome-erro" : undefined}
              className={entrada(Boolean(erros.responsavelNome))}
            />
          </Campo>

          <Campo id="responsavelCpf" rotulo="CPF do responsável" erro={erros.responsavelCpf}>
            <input
              id="responsavelCpf"
              name="responsavelCpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={mascaraCpf(valores.responsavelCpf)}
              onChange={(e) =>
                altera("responsavelCpf", e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              onBlur={() => aoSair("responsavelCpf")}
              aria-invalid={Boolean(erros.responsavelCpf)}
              aria-describedby={erros.responsavelCpf ? "responsavelCpf-erro" : undefined}
              className={`${entrada(Boolean(erros.responsavelCpf))} dados`}
            />
          </Campo>
        </Grupo>
      )}

      <Grupo titulo="Camisa e equipe">
        <Campo id="tamanhoCamisa" rotulo="Tamanho da camisa" erro={erros.tamanhoCamisa}>
          <div role="radiogroup" aria-label="Tamanho da camisa" className="flex flex-wrap gap-2">
            {TAMANHOS_CAMISA.map((tamanho) => {
              const marcado = valores.tamanhoCamisa === tamanho;
              return (
                <button
                  key={tamanho}
                  type="button"
                  role="radio"
                  aria-checked={marcado}
                  name={marcado ? "tamanhoCamisa" : undefined}
                  onClick={() => altera("tamanhoCamisa", tamanho)}
                  className={`acao dados min-h-12 min-w-14 rounded-[4px] border px-3 font-medium ${
                    marcado
                      ? "border-azul bg-azul text-white"
                      : "border-asfalto/25 bg-white hover:border-asfalto"
                  }`}
                >
                  {tamanho}
                </button>
              );
            })}
          </div>
        </Campo>

        <Campo id="modeloCamisa" rotulo="Modelo da camisa" opcional>
          <div role="radiogroup" aria-label="Modelo da camisa" className="flex flex-col gap-2 sm:flex-row">
            {MODELOS_CAMISA.map((opcao) => (
              <OpcaoRadio
                key={opcao.valor}
                nome="modeloCamisa"
                valor={opcao.valor}
                rotulo={opcao.rotulo}
                marcado={valores.modeloCamisa === opcao.valor}
                aoMarcar={() =>
                  altera("modeloCamisa", valores.modeloCamisa === opcao.valor ? "" : opcao.valor)
                }
              />
            ))}
          </div>
        </Campo>

        <Campo id="equipe" rotulo="Equipe" opcional>
          <input
            id="equipe"
            name="equipe"
            type="text"
            placeholder="Assessoria ou grupo de corrida"
            value={valores.equipe}
            onChange={(e) => altera("equipe", e.target.value)}
            className={entrada(false)}
          />
        </Campo>
      </Grupo>

      <Grupo titulo="Em caso de emergência">
        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="contatoEmergenciaNome" rotulo="Nome do contato" erro={erros.contatoEmergenciaNome}>
            <input
              id="contatoEmergenciaNome"
              name="contatoEmergenciaNome"
              type="text"
              autoCapitalize="words"
              value={valores.contatoEmergenciaNome}
              onChange={(e) => altera("contatoEmergenciaNome", e.target.value)}
              onBlur={() => aoSair("contatoEmergenciaNome")}
              aria-invalid={Boolean(erros.contatoEmergenciaNome)}
              aria-describedby={
                erros.contatoEmergenciaNome ? "contatoEmergenciaNome-erro" : undefined
              }
              className={entrada(Boolean(erros.contatoEmergenciaNome))}
            />
          </Campo>

          <Campo
            id="contatoEmergenciaTelefone"
            rotulo="Telefone do contato"
            erro={erros.contatoEmergenciaTelefone}
          >
            <input
              id="contatoEmergenciaTelefone"
              name="contatoEmergenciaTelefone"
              type="tel"
              inputMode="numeric"
              placeholder="(00) 00000-0000"
              value={mascaraTelefone(valores.contatoEmergenciaTelefone)}
              onChange={(e) =>
                altera("contatoEmergenciaTelefone", e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              onBlur={() => aoSair("contatoEmergenciaTelefone")}
              aria-invalid={Boolean(erros.contatoEmergenciaTelefone)}
              aria-describedby={
                erros.contatoEmergenciaTelefone ? "contatoEmergenciaTelefone-erro" : undefined
              }
              className={`${entrada(Boolean(erros.contatoEmergenciaTelefone))} dados`}
            />
          </Campo>
        </div>
      </Grupo>

      <Grupo titulo="Pagamento">
        <Campo
          id="formaPagamento"
          rotulo="Como você vai pagar"
          erro={erros.formaPagamento}
          dica="O pagamento é combinado com a organização no WhatsApp, depois de enviar."
        >
          <div role="radiogroup" aria-label="Forma de pagamento" className="flex flex-col gap-2 sm:flex-row">
            {dados.formasPagamento.map((opcao) => (
              <OpcaoRadio
                key={opcao.valor}
                nome="formaPagamento"
                valor={opcao.valor}
                rotulo={opcao.rotulo}
                marcado={valores.formaPagamento === opcao.valor}
                aoMarcar={() => altera("formaPagamento", opcao.valor)}
              />
            ))}
          </div>
        </Campo>
      </Grupo>

      <Grupo titulo="Declarações">
        <Aceite
          id="aceiteRegulamento"
          marcado={valores.aceiteRegulamento}
          erro={erros.aceiteRegulamento}
          aoMarcar={(marcado) => altera("aceiteRegulamento", marcado)}
        >
          Li o regulamento e assumo total responsabilidade pela minha participação,
          declarando estar apto fisicamente para a prova.
          {dados.regulamentoUrl && (
            <>
              {" "}
              <a
                href={dados.regulamentoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-azul underline underline-offset-2"
              >
                Ler o regulamento
              </a>
              .
            </>
          )}
        </Aceite>

        <Aceite
          id="aceiteLgpd"
          marcado={valores.aceiteLgpd}
          erro={erros.aceiteLgpd}
          aoMarcar={(marcado) => altera("aceiteLgpd", marcado)}
        >
          Autorizo o uso dos meus dados para organização do evento, conforme o{" "}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-azul underline underline-offset-2"
          >
            aviso de privacidade
          </a>
          .
        </Aceite>
      </Grupo>

      <div aria-live="polite" className="empty:hidden">
        {avisoGeral && (
          <div
            className={`border p-4 text-sm ${
              avisoGeral.tipo === "lote"
                ? "border-amarelo bg-amarelo/15"
                : "border-erro/40 bg-erro/5"
            }`}
          >
            <p className="flex items-start gap-2 font-medium">
              <IconeAlerta className="mt-0.5 size-4 shrink-0" />
              {avisoGeral.mensagem}
            </p>

            {avisoGeral.tipo === "lote" && avisoGeral.lote && (
              <Botao
                type="button"
                variante="estrutura"
                className="mt-4"
                onClick={() => {
                  const novo = avisoGeral.lote!;
                  setLote(novo);
                  setAvisoGeral(null);
                  void enviar(novo);
                }}
              >
                Continuar por {formataMoeda(avisoGeral.lote.precoCentavos)}
              </Botao>
            )}

            {avisoGeral.tipo === "erro" && dados.whatsappOrganizador && (
              <a
                href={`https://wa.me/${dados.whatsappOrganizador.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="acao mt-3 inline-flex items-center gap-2 text-sm font-semibold text-azul underline underline-offset-4"
              >
                <IconeWhatsapp className="size-4" />
                Falar com a organização
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-asfalto/15 pt-8">
        <Botao type="submit" tamanho="grande" disabled={enviando || temErroVisivel}>
          {enviando ? "Enviando…" : "Enviar inscrição"}
        </Botao>
          {temErroVisivel && !enviando ? (
            // O botão nunca fica desabilitado em silêncio: aqui diz por quê.
            <p role="status" className="text-center text-sm text-erro">
              Confira os campos marcados acima para continuar.
            </p>
          ) : (
            <p className="text-center text-xs text-traco">
              {modalidadeEscolhida ? `${modalidadeEscolhida.nome} · ` : ""}
              {formataMoeda(lote.precoCentavos)} · pagamento combinado no WhatsApp
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Barra no topo em mobile, card fixo no desktop. O valor é sempre o do lote em
 * vigor — se ele virar no meio do preenchimento, o servidor devolve o novo e o
 * participante reconfirma.
 */
function Resumo({
  nomeEvento,
  modalidade,
  lote,
}: {
  nomeEvento: string;
  modalidade: string | null;
  lote: { nome: string; precoCentavos: number };
}) {
  return (
    <aside className="md:col-start-2 md:row-start-1">
      {/* mobile */}
      <div className="sticky top-(--altura-cabecalho) z-30 -mx-(--margem-pagina) flex items-center justify-between gap-4 border-b border-asfalto/15 bg-papel px-(--margem-pagina) py-3 md:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{nomeEvento}</p>
          <p className="dados truncate text-xs text-traco">
            {modalidade ?? "Escolha a modalidade"}
          </p>
        </div>
        <p className="numeral shrink-0 text-lg text-azul">{formataMoeda(lote.precoCentavos)}</p>
      </div>

      {/* desktop */}
      <div className="hidden md:sticky md:top-[calc(var(--altura-cabecalho)+24px)] md:block md:border md:border-asfalto/20 md:bg-white">
        <div className="perfuracao" aria-hidden />
        <div className="p-5">
          <p className="rotulo text-traco">Sua inscrição</p>
          <p className="mt-3 font-display text-lg leading-tight font-extrabold [font-stretch:110%]">
            {nomeEvento}
          </p>

          <dl className="mt-4 flex flex-col gap-3 border-t border-asfalto/12 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-traco">Modalidade</dt>
              <dd className="dados text-right">{modalidade ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-traco">Lote</dt>
              <dd className="dados text-right">{lote.nome}</dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-asfalto/12 pt-4">
            <span className="rotulo block text-traco">Valor</span>
            <span className="numeral text-xl text-azul">{formataMoeda(lote.precoCentavos)}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

function OpcaoRadio({
  nome,
  valor,
  rotulo,
  marcado,
  aoMarcar,
}: {
  nome: string;
  valor: string;
  rotulo: string;
  marcado: boolean;
  aoMarcar: () => void;
}) {
  return (
    <label
      className={`acao flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-[4px] border px-3 text-sm ${
        marcado ? "border-azul bg-azul/6 font-semibold" : "border-asfalto/25 bg-white hover:border-asfalto"
      }`}
    >
      <input
        type="radio"
        name={nome}
        value={valor}
        checked={marcado}
        onChange={aoMarcar}
        className="size-4 accent-azul"
      />
      {rotulo}
    </label>
  );
}

function Aceite({
  id,
  marcado,
  erro,
  aoMarcar,
  children,
}: {
  id: string;
  marcado: boolean;
  erro?: string | null;
  aoMarcar: (marcado: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-[4px] border p-4 text-sm ${
          erro ? "border-erro" : "border-asfalto/20 bg-white"
        }`}
      >
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={marcado}
          onChange={(e) => aoMarcar(e.target.checked)}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-azul"
        />
        <span>{children}</span>
      </label>

      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-erro">
          <IconeAlerta className="mt-0.5 size-4" />
          {erro}
        </p>
      )}
    </div>
  );
}
