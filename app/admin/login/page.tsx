import { redirect } from "next/navigation";
import { Marca } from "@/components/marca";
import { CampoAdmin } from "@/components/admin/campos";
import { FormularioAcao } from "@/components/admin/formulario-acao";
import { entrar } from "@/lib/acoes-admin";
import { organizadorDaSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  if (await organizadorDaSessao()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-papel px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Marca />
        </div>

        <div className="border border-asfalto/20 bg-white">
          <div className="perfuracao" aria-hidden />
          <div className="p-6">
            <h1 className="text-lg">Painel do organizador</h1>
            <p className="mt-2 text-sm text-traco">
              Entre para cadastrar provas e acompanhar os inscritos.
            </p>

            <FormularioAcao acao={entrar} rotuloEnvio="Entrar" rotuloEnviando="Entrando…" className="mt-6">
              <CampoAdmin
                nome="email"
                rotulo="E-mail"
                tipo="email"
                obrigatorio
                autoComplete="username"
              />
              <CampoAdmin
                nome="senha"
                rotulo="Senha"
                tipo="password"
                obrigatorio
                autoComplete="current-password"
              />
            </FormularioAcao>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-traco">
          Esqueceu a senha? Só quem tem acesso ao servidor consegue redefinir — veja o
          GUIA-DO-ORGANIZADOR.
        </p>
      </div>
    </div>
  );
}
