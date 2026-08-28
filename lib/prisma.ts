import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * O site precisa renderizar mesmo sem banco (build na Vercel antes da primeira
 * migração, VPS com o Postgres fora do ar). Em vez de quebrar a página, cai no
 * estado vazio — que já é um estado previsto no design.
 */
export async function consultaSegura<T>(consulta: () => Promise<T>, padrao: T): Promise<T> {
  try {
    return await consulta();
  } catch (erro) {
    console.error("[moveon] consulta ao banco falhou:", erro);
    return padrao;
  }
}
