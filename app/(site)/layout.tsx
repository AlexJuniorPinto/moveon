import Link from "next/link";
import { Marca } from "@/components/marca";
import { IconeInstagram, IconeWhatsapp } from "@/components/icones";
import { telefoneLegivel } from "@/lib/formatos";
import { organizadorPrincipal } from "@/lib/organizador";
import { DEMO } from "@/lib/demo";

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const organizador = await organizadorPrincipal();
  const linkWhats = organizador
    ? `https://wa.me/${organizador.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-[4px] bg-azul px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      {DEMO && (
        <p className="bg-amarelo px-4 py-2 text-center text-sm text-asfalto">
          <strong className="font-semibold">Demonstração.</strong> As provas são de exemplo
          e nenhuma inscrição é gravada.
        </p>
      )}

      <header className="sticky top-0 z-40 border-b border-asfalto/10 bg-papel">
        <div className="pagina flex h-(--altura-cabecalho) items-center justify-between gap-4">
          <Marca />

          {linkWhats && (
            <a
              href={linkWhats}
              target="_blank"
              rel="noopener noreferrer"
              className="acao inline-flex min-h-10 items-center gap-2 rounded-[4px] border border-asfalto/20 px-3 text-sm font-medium hover:border-asfalto hover:bg-asfalto/5"
            >
              <IconeWhatsapp className="size-4 text-verde-escuro" />
              <span className="hidden sm:inline">Falar com a organização</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="sobre-escuro mt-24 bg-asfalto text-papel">
        <div className="pagina grid gap-10 py-14 md:grid-cols-[1fr_auto]">
          <div>
            <Marca href={null} tom="escuro" />
            <p className="mt-4 max-w-sm text-sm text-papel/70">
              Inscrições nas corridas de rua organizadas pela MoveON. Você preenche o formulário e finaliza o
              pagamento direto no WhatsApp.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm md:items-end">
            {linkWhats && (
              <a
                href={linkWhats}
                target="_blank"
                rel="noopener noreferrer"
                className="acao inline-flex items-center gap-2 hover:text-verde"
              >
                <IconeWhatsapp className="size-4" />
                <span className="dados">{telefoneLegivel(organizador!.whatsapp)}</span>
              </a>
            )}
            {organizador?.instagram && (
              <a
                href={`https://instagram.com/${organizador.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="acao inline-flex items-center gap-2 hover:text-verde"
              >
                <IconeInstagram className="size-4" />
                <span>{organizador.instagram}</span>
              </a>
            )}
            <Link href="/privacidade" className="acao text-papel/70 hover:text-papel">
              Aviso de privacidade
            </Link>
          </div>
        </div>

        <div className="border-t border-papel/10">
          <div className="pagina flex flex-wrap items-center justify-between gap-2 py-5">
            <p className="rotulo text-papel/50">MoveON · inscrições em corridas de rua</p>
            {/* O painel exige servidor: no build de demonstração ele não existe,
                então o rodapé aponta para o guia. */}
            {DEMO ? (
              <a
                href="/moveon/guia/"
                className="rotulo acao text-papel/50 hover:text-papel"
              >
                Guia do organizador
              </a>
            ) : (
              <Link href="/admin" className="rotulo acao text-papel/50 hover:text-papel">
                Painel do organizador
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
