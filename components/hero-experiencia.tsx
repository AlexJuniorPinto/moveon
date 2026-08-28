import Image from "next/image";
import imagemHero from "@/hero.png";

/** A imagem mantém a cena da corrida no plano de fundo do topo do site. */
export function HeroExperiencia({ children }: { children: React.ReactNode }) {
  return (
    <section className="hero-moveon text-papel">
      <Image
        src={imagemHero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-moveon-imagem"
      />
      {children}
      <div className="linha-ritmo" aria-hidden="true" />
    </section>
  );
}
