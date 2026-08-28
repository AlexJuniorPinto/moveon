import type { NextConfig } from "next";

const hostsDeImagem = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Imagem enxuta para o Docker do VPS. Ignorado pela Vercel.
  output: "standalone",
  images: {
    formats: ["image/webp"],
    remotePatterns: hostsDeImagem.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  experimental: {
    // Mantém o bundle do cliente enxuto: só o que a página usa entra no chunk.
    optimizePackageImports: [],
  },
};

export default nextConfig;
