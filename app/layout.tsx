import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--fonte-display",
  display: "swap",
});

const corpo = Public_Sans({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});

const dados = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fonte-dados",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "MoveON — inscrições em corridas de rua",
    template: "%s · MoveON",
  },
  description:
    "Inscreva-se nas corridas de rua da região em menos de dois minutos e finalize no WhatsApp.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "MoveON",
  },
};

export const viewport: Viewport = {
  themeColor: "#20242B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable} ${dados.variable}`}>
      <body className="min-h-dvh bg-papel text-asfalto antialiased">{children}</body>
    </html>
  );
}
