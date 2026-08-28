import type { NextConfig } from "next";

/**
 * MOVEON_DEMO=1 gera o site público como HTML estático, sem banco e sem painel,
 * para publicar no GitHub Pages. A build normal continua sendo a de produção.
 */
const demo = process.env.MOVEON_DEMO === "1";

const hostsDeImagem = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ["image/webp"],
    // O Pages não tem servidor para otimizar imagem.
    unoptimized: demo,
    remotePatterns: hostsDeImagem.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },

  ...(demo
    ? {
        output: "export" as const,
        basePath: "/moveon",
        trailingSlash: true,
      }
    : {
        // Imagem enxuta para o Docker do VPS. Ignorado pela Vercel.
        output: "standalone" as const,
      }),
};

export default nextConfig;
