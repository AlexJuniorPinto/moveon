import Image from "next/image";
import imagemHero from "@/hero.png";

/**
 * A foto da corrida ocupa o primeiro viewport inteiro — o cabeçalho passa por
 * cima dela, transparente, enquanto a página está no topo. O escurecimento e a
 * vinheta vivem no CSS (`.hero-moveon`), porque são luz, não marcação.
 */
export function HeroExperiencia({ children }: { children: React.ReactNode }) {
  return (
    <section className="hero-moveon sobre-escuro text-papel">
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
