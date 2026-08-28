import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Registra que o participante clicou em "Finalizar no WhatsApp".
 * Só avança de 'pendente' para 'aguardando_confirmacao' — nunca reabre uma
 * inscrição já confirmada ou cancelada pelo organizador.
 */
export async function POST(
  _requisicao: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params;

  try {
    const resultado = await prisma.inscricao.updateMany({
      where: { numeroInscricao: numero, status: "pendente" },
      data: { status: "aguardando_confirmacao" },
    });
    return NextResponse.json({ atualizada: resultado.count > 0 });
  } catch (erro) {
    console.error("[moveon] falha ao registrar clique no WhatsApp:", erro);
    // O clique não pode falhar para o participante: ele segue para o WhatsApp.
    return NextResponse.json({ atualizada: false });
  }
}
