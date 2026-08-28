import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/components/marca";
import { prisma } from "@/lib/prisma";
import { organizadorDaSessao } from "@/lib/auth";
import { sair } from "@/lib/acoes-admin";

export const dynamic = "force-dynamic";

const NAVEGACAO = [
  { href: "/admin", rotulo: "Resumo" },
  { href: "/admin/eventos", rotulo: "Provas" },
  { href: "/admin/configuracoes", rotulo: "Configurações" },
];

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const organizadorId = await organizadorDaSessao();
  if (!organizadorId) redirect("/admin/login");

  const organizador = await prisma.organizador
    .findUnique({ where: { id: organizadorId }, select: { nome: true } })
    .catch(() => null);

  // Sessão válida assinada, mas o organizador não existe mais no banco.
  if (!organizador) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      <header className="sticky top-0 z-40 border-b border-asfalto/15 bg-papel">
        <div className="pagina flex h-(--altura-cabecalho) items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Marca href="/admin" />
            <span className="rotulo hidden text-traco sm:inline">Painel</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-traco md:inline">{organizador.nome}</span>
            <form action={sair}>
              <button
                type="submit"
                className="acao min-h-10 cursor-pointer rounded-[4px] border border-asfalto/20 px-3 text-sm font-medium hover:border-asfalto hover:bg-asfalto/5"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        <nav className="border-t border-asfalto/10">
          <ul className="pagina flex gap-6 overflow-x-auto">
            {NAVEGACAO.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="acao inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-medium whitespace-nowrap text-traco hover:border-asfalto/30 hover:text-asfalto"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link
                href="/"
                target="_blank"
                className="acao inline-flex min-h-11 items-center text-sm whitespace-nowrap text-traco hover:text-asfalto"
              >
                Ver o site ↗
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="pagina flex-1 py-8">{children}</main>
    </div>
  );
}
