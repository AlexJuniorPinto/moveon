#!/usr/bin/env node
/**
 * Gera a demonstração estática publicada no GitHub Pages.
 *
 * O painel e as rotas de API precisam de servidor e não existem em
 * `output: export`. Em vez de removê-los da árvore de trabalho, o build roda
 * sobre uma cópia temporária do projeto — assim nada aqui é modificado, mesmo
 * se o build falhar no meio.
 *
 * `node_modules` não é copiado: entra como link para a pasta original.
 *
 * Uso: npm run build:demo
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const raiz = process.cwd();
const temp = join(tmpdir(), "moveon-demo-build");

const COPIAR = [
  "app",
  "components",
  "lib",
  "prisma",
  "public",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "package.json",
];

const SEM_SERVIDOR_NAO_EXISTE = ["app/admin", "app/api"];

console.log("→ preparando cópia em", temp);
rmSync(temp, { recursive: true, force: true });
mkdirSync(temp, { recursive: true });

for (const alvo of COPIAR) {
  const de = join(raiz, alvo);
  if (existsSync(de)) cpSync(de, join(temp, alvo), { recursive: true });
}

for (const alvo of SEM_SERVIDOR_NAO_EXISTE) {
  rmSync(join(temp, alvo), { recursive: true, force: true });
}

// O Next lê `dynamic` e `revalidate` por análise estática do arquivo, então
// esses valores não podem ser condicionais no código-fonte: a troca acontece
// aqui, só na cópia.
const TROCAS = [
  ["app/(site)/page.tsx", "export const revalidate = 60;", "export const revalidate = false;"],
  ["app/(site)/privacidade/page.tsx", "export const revalidate = 3600;", "export const revalidate = false;"],
  ["app/(site)/evento/[slug]/page.tsx", "export const revalidate = 60;", "export const revalidate = false;"],
  ['app/(site)/evento/[slug]/inscricao/page.tsx', 'export const dynamic = "force-dynamic";', 'export const dynamic = "force-static";'],
  ['app/(site)/inscricao/[numero]/page.tsx', 'export const dynamic = "force-dynamic";', 'export const dynamic = "force-static";'],
];

for (const [arquivo, de, para] of TROCAS) {
  const caminho = join(temp, arquivo);
  const conteudo = readFileSync(caminho, "utf8");
  if (!conteudo.includes(de)) {
    throw new Error(`build-demo: nao encontrei "${de}" em ${arquivo}`);
  }
  writeFileSync(caminho, conteudo.replace(de, para));
}

// Junction no Windows, symlink de diretório no resto: evita copiar 300 MB.
symlinkSync(
  join(raiz, "node_modules"),
  join(temp, "node_modules"),
  process.platform === "win32" ? "junction" : "dir"
);

console.log("→ build estático (MOVEON_DEMO=1)");
execSync("npx next build", {
  cwd: temp,
  stdio: "inherit",
  env: {
    ...process.env,
    MOVEON_DEMO: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    // O Prisma exige a variável mesmo sem nunca conectar no modo demonstração.
    DATABASE_URL: "postgresql://demo:demo@localhost:5432/demo",
    DIRECT_URL: "postgresql://demo:demo@localhost:5432/demo",
  },
});

const saida = join(raiz, "out");
rmSync(saida, { recursive: true, force: true });
cpSync(join(temp, "out"), saida, { recursive: true });

console.log("→ guia do organizador em /guia");
mkdirSync(join(saida, "guia"), { recursive: true });
cpSync(join(raiz, "docs/index.html"), join(saida, "guia/index.html"));

// Sem isto o Pages passa tudo pelo Jekyll e descarta arquivos com underscore.
writeFileSync(join(saida, ".nojekyll"), "");

console.log("\nPronto: out/");
