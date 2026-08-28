import type { Evento } from "@prisma/client";
import { AreaAdmin, CampoAdmin, Marcador, Painel } from "@/components/admin/campos";
import { FormularioAcao } from "@/components/admin/formulario-acao";
import { paraCampoDataHora } from "@/lib/formatos";
import type { Resultado } from "@/lib/acoes-admin";

export function FormularioEvento({
  acao,
  evento,
  rotuloEnvio,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  evento?: Evento;
  rotuloEnvio: string;
}) {
  return (
    <FormularioAcao acao={acao} rotuloEnvio={rotuloEnvio}>
      {evento && <input type="hidden" name="id" value={evento.id} />}

      <Painel titulo="Identificação">
        <div className="grid gap-5 md:grid-cols-2">
          <CampoAdmin
            nome="nome"
            rotulo="Nome da prova"
            obrigatorio
            valor={evento?.nome}
            placeholder="Corrida do Fogo 2026"
            className="md:col-span-2"
          />
          <CampoAdmin
            nome="subtitulo"
            rotulo="Subtítulo"
            valor={evento?.subtitulo}
            dica="Uma linha que aparece embaixo do nome."
            className="md:col-span-2"
          />
          <CampoAdmin
            nome="slug"
            rotulo="Endereço no site"
            valor={evento?.slug}
            dica="Deixe em branco para gerar a partir do nome."
            placeholder="corrida-do-fogo-2026"
          />
          <CampoAdmin
            nome="sigla"
            rotulo="Sigla"
            valor={evento?.sigla}
            maxLength={3}
            dica="Três letras usadas no número de inscrição: MV-2026-CFO-0087."
            placeholder="CFO"
          />
        </div>
      </Painel>

      <Painel titulo="Data e local">
        <div className="grid gap-5 md:grid-cols-2">
          <CampoAdmin
            nome="dataEvento"
            rotulo="Data e hora da prova"
            tipo="datetime-local"
            obrigatorio
            valor={paraCampoDataHora(evento?.dataEvento)}
          />
          <CampoAdmin
            nome="localNome"
            rotulo="Local"
            obrigatorio
            valor={evento?.localNome}
            placeholder="Praça da Matriz"
          />
          <CampoAdmin nome="cidade" rotulo="Cidade" obrigatorio valor={evento?.cidade} />
          <CampoAdmin
            nome="uf"
            rotulo="UF"
            obrigatorio
            valor={evento?.uf}
            maxLength={2}
            placeholder="MG"
          />
          <CampoAdmin
            nome="endereco"
            rotulo="Endereço completo"
            valor={evento?.endereco}
            className="md:col-span-2"
          />
        </div>
      </Painel>

      <Painel titulo="Inscrições">
        <div className="grid gap-5 md:grid-cols-3">
          <CampoAdmin
            nome="inscricoesAbremEm"
            rotulo="Abrem em"
            tipo="datetime-local"
            valor={paraCampoDataHora(evento?.inscricoesAbremEm)}
            dica="Em branco: já estão abertas."
          />
          <CampoAdmin
            nome="inscricoesFechamEm"
            rotulo="Fecham em"
            tipo="datetime-local"
            valor={paraCampoDataHora(evento?.inscricoesFechamEm)}
            dica="Em branco: até a data da prova."
          />
          <CampoAdmin
            nome="limiteVagas"
            rotulo="Limite de vagas"
            tipo="number"
            min={0}
            valor={evento?.limiteVagas}
            dica="Em branco: sem limite."
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Marcador nome="aceitaPix" rotulo="Aceita Pix" marcado={evento?.aceitaPix ?? true} />
          <Marcador
            nome="aceitaDinheiro"
            rotulo="Aceita dinheiro"
            dica="Na retirada do kit"
            marcado={evento?.aceitaDinheiro ?? false}
          />
          <Marcador
            nome="destaque"
            rotulo="Destacar na vitrine"
            dica="Aparece primeiro"
            marcado={evento?.destaque ?? false}
          />
        </div>
      </Painel>

      <Painel titulo="Conteúdo da página" descricao="Tudo aqui é opcional e aparece na página da prova.">
        <div className="grid gap-5">
          <AreaAdmin
            nome="descricao"
            rotulo="Sobre a prova"
            valor={evento?.descricao}
            dica="Separe os parágrafos com uma linha em branco."
          />
          <AreaAdmin nome="percurso" rotulo="Percurso" valor={evento?.percurso} linhas={3} />
          <AreaAdmin nome="kit" rotulo="O que vem no kit" valor={evento?.kit} linhas={3} />

          <div className="grid gap-5 md:grid-cols-2">
            <CampoAdmin
              nome="horarioLargada"
              rotulo="Horário da largada"
              valor={evento?.horarioLargada}
              placeholder="7h — concentração às 6h30"
            />
            <CampoAdmin
              nome="retiradaKit"
              rotulo="Retirada do kit"
              valor={evento?.retiradaKit}
              placeholder="Sexta, 11/09, das 14h às 20h"
            />
            <CampoAdmin
              nome="imagemCapaUrl"
              rotulo="Link da foto de capa"
              tipo="url"
              valor={evento?.imagemCapaUrl}
              dica="Enquanto não houver foto, o card mostra o nome da prova."
            />
            <CampoAdmin
              nome="regulamentoUrl"
              rotulo="Link do regulamento (PDF)"
              tipo="url"
              valor={evento?.regulamentoUrl}
            />
          </div>
        </div>
      </Painel>
    </FormularioAcao>
  );
}
