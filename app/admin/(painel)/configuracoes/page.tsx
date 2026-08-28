import { redirect } from "next/navigation";
import { CampoAdmin, Painel, entradaAdmin } from "@/components/admin/campos";
import { FormularioAcao } from "@/components/admin/formulario-acao";
import { prisma } from "@/lib/prisma";
import { organizadorDaSessao } from "@/lib/auth";
import { salvarConfiguracoes } from "@/lib/acoes-admin";
import { telefoneLegivel } from "@/lib/formatos";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configurações" };

const TIPOS_PIX = [
  { valor: "telefone", rotulo: "Telefone" },
  { valor: "cpf", rotulo: "CPF" },
  { valor: "cnpj", rotulo: "CNPJ" },
  { valor: "email", rotulo: "E-mail" },
  { valor: "aleatoria", rotulo: "Chave aleatória" },
];

export default async function Configuracoes() {
  const organizadorId = await organizadorDaSessao();
  if (!organizadorId) redirect("/admin/login");

  const organizador = await prisma.organizador.findUnique({ where: { id: organizadorId } });
  if (!organizador) redirect("/admin/login");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="rotulo text-traco">Configurações</p>
        <h1 className="mt-2 text-xl">Seus dados</h1>
        <p className="mt-2 max-w-lg text-sm text-traco">
          O WhatsApp aqui é o número que recebe as mensagens de todas as inscrições, e
          aparece no cabeçalho e no rodapé do site.
        </p>
      </div>

      <FormularioAcao acao={salvarConfiguracoes} rotuloEnvio="Salvar dados">
        <Painel titulo="Organização">
          <div className="grid gap-5 md:grid-cols-2">
            <CampoAdmin
              nome="nome"
              rotulo="Nome da organização"
              obrigatorio
              valor={organizador.nome}
              className="md:col-span-2"
            />
            <CampoAdmin
              nome="whatsapp"
              rotulo="WhatsApp"
              obrigatorio
              valor={telefoneLegivel(organizador.whatsapp)}
              dica="Com DDD. É para onde vão as mensagens de inscrição."
              placeholder="(37) 99999-9999"
            />
            <CampoAdmin
              nome="instagram"
              rotulo="Instagram"
              valor={organizador.instagram}
              placeholder="@moveon.corridas"
            />
            <CampoAdmin
              nome="logoUrl"
              rotulo="Link da logo"
              tipo="url"
              valor={organizador.logoUrl}
              className="md:col-span-2"
            />
          </div>
        </Painel>

        <Painel
          titulo="Pix"
          descricao="A chave não aparece no site. Fica aqui para você copiar rápido na hora de responder no WhatsApp."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <CampoAdmin nome="chavePix" rotulo="Chave Pix" valor={organizador.chavePix} />
            <div>
              <label htmlFor="tipoChavePix" className="text-sm font-semibold">
                Tipo da chave
              </label>
              <select
                id="tipoChavePix"
                name="tipoChavePix"
                defaultValue={organizador.tipoChavePix ?? ""}
                className={`${entradaAdmin} mt-2`}
              >
                <option value="">Não informado</option>
                {TIPOS_PIX.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.rotulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Painel>

        <Painel titulo="Acesso" descricao={`Você entra com ${organizador.email}.`}>
          <CampoAdmin
            nome="senha"
            rotulo="Nova senha"
            tipo="password"
            autoComplete="new-password"
            minLength={8}
            dica="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres."
            className="md:max-w-sm"
          />
        </Painel>
      </FormularioAcao>
    </div>
  );
}
