import Link from "next/link";
import { classesBotao } from "@/components/ui/botao";
import { Marca } from "@/components/marca";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-asfalto/10">
        <div className="pagina flex h-(--altura-cabecalho) items-center">
          <Marca />
        </div>
      </header>

      <main className="pagina flex flex-1 flex-col justify-center py-20">
        <p className="numeral text-3xl text-azul">404</p>
        <h1 className="mt-4 text-xl md:text-2xl">Essa página não existe.</h1>
        <p className="mt-3 max-w-sm text-traco">
          O endereço pode ter mudado, ou a prova saiu do ar. Veja as provas abertas agora.
        </p>
        <p className="mt-8">
          <Link href="/" className={classesBotao("avanco", "grande")}>
            Ver provas abertas
          </Link>
        </p>
      </main>
    </div>
  );
}
