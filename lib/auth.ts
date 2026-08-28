import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const NOME_COOKIE = "moveon_sessao";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7;

function segredo(): string {
  const s = process.env.SESSAO_SEGREDO;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSAO_SEGREDO ausente ou curto demais (mínimo 32 caracteres).");
    }
    return "segredo-de-desenvolvimento-nao-use-em-producao";
  }
  return s;
}

// ---------- senha ----------

export function hashSenha(senha: string): string {
  const sal = randomBytes(16).toString("hex");
  const derivada = scryptSync(senha, sal, 64).toString("hex");
  return `scrypt:${sal}:${derivada}`;
}

export function verificaSenha(senha: string, armazenada: string): boolean {
  const [algoritmo, sal, esperada] = armazenada.split(":");
  if (algoritmo !== "scrypt" || !sal || !esperada) return false;
  const derivada = scryptSync(senha, sal, 64);
  const alvo = Buffer.from(esperada, "hex");
  if (alvo.length !== derivada.length) return false;
  return timingSafeEqual(derivada, alvo);
}

// ---------- sessão ----------

function assina(dados: string): string {
  return createHmac("sha256", segredo()).update(dados).digest("base64url");
}

function criaToken(organizadorId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id: organizadorId, exp: Date.now() + DURACAO_SEGUNDOS * 1000 })
  ).toString("base64url");
  return `${payload}.${assina(payload)}`;
}

function leToken(token: string): string | null {
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assina(payload));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  try {
    const dados = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      id: string;
      exp: number;
    };
    if (!dados.id || Date.now() > dados.exp) return null;
    return dados.id;
  } catch {
    return null;
  }
}

export async function abrirSessao(organizadorId: string): Promise<void> {
  const jar = await cookies();
  jar.set(NOME_COOKIE, criaToken(organizadorId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function fecharSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOME_COOKIE);
}

export async function organizadorDaSessao(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(NOME_COOKIE)?.value;
  return token ? leToken(token) : null;
}
