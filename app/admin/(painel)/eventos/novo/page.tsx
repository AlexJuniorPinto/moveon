import Link from "next/link";
import { FormularioEvento } from "@/components/admin/formulario-evento";
import { criarEvento } from "@/lib/acoes-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Criar prova" };

export default function NovaProva() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <nav className="text-sm">
          <Link
            href="/admin/eventos"
            className="acao text-traco underline underline-offset-4 hover:text-asfalto"
          >
            ← Provas
          </Link>
        </nav>
        <h1 className="mt-3 text-xl">Criar prova</h1>
        <p className="mt-2 max-w-lg text-sm text-traco">
          A prova é criada como rascunho. Depois de salvar você cadastra as modalidades e os
          lotes, e então publica.
        </p>
      </div>

      <FormularioEvento acao={criarEvento} rotuloEnvio="Criar prova" />
    </div>
  );
}
