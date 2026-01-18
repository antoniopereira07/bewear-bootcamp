import Image from "next/image";

import { Button } from "../ui/button";

/**
 * Gradientes:
 * - Azul (jacket):  #A0CBE9 -> #EAEFFA
 * - Preto (shoe):   #B9BBCA -> #EEEFF6
 * - Roxo (shoe):    #B0B1F0 -> #EAEFFA
 *
 * Imagens:
 * - /promo/shoe-black.png   (1026x614)
 * - /promo/shoe-purple.png  (1026x614)
 * - /promo/jacket-blue.png  (1630x1276)
 */
export default function PromoGrid() {
  return (
    <section className="mx-5 grid gap-4 md:grid-cols-3">
      {/* Coluna esquerda: 2 cards (tênis) */}
      <div className="grid gap-4">
        <PromoCard
          title="Nike Therma FIT Headed"
          gradient="bg-[linear-gradient(180deg,#B9BBCA_0%,#EEEFF6_100%)]"
          img={{ src: "/promo/shoe-black.png", width: 1026, height: 614 }}
          ratio="aspect-[1026/614]"
        />

        <PromoCard
          title="Nike Therma FIT Headed"
          gradient="bg-[linear-gradient(180deg,#B0B1F0_0%,#EAEFFA_100%)]"
          img={{ src: "/promo/shoe-purple.png", width: 1026, height: 614 }}
          ratio="aspect-[1026/614]"
        />
      </div>

      {/* Card grande: jaqueta azul (2 colunas no desktop) */}
      <PromoCard
        className="md:col-span-2"
        title="Nike Therma FIT Headed"
        gradient="bg-[linear-gradient(180deg,#A0CBE9_0%,#EAEFFA_100%)]"
        img={{ src: "/promo/jacket-blue.png", width: 1630, height: 1276 }}
        ratio="aspect-[1630/1276]"
      />
    </section>
  );
}

type PromoCardProps = {
  title: string;
  gradient: string;
  img: { src: string; width: number; height: number };
  ratio: string; // ex: "aspect-[1026/614]"
  className?: string;
};

/** Card reutilizável com título, imagem e CTA */
function PromoCard({ title, gradient, img, ratio, className }: PromoCardProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl p-5",
        "shadow-sm transition",
        gradient,
        className ?? "",
      ].join(" ")}
    >
      {/* Título */}
      <h4 className="z-10 mb-2 text-xl font-semibold text-white drop-shadow md:text-2xl">
        {title}
      </h4>

      {/* Área da imagem com ratio estável */}
      <div className={`relative ${ratio} w-full`}>
        <Image
          src={img.src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          // Para tênis e jaqueta manterem a proporção sem cortar:
          className="object-contain"
          // Informar as dimensões reais ajuda o Next a otimizar:
          priority={false}
        />
      </div>

      {/* CTA */}
      <Button className="absolute right-5 bottom-5 rounded-full bg-white px-6 py-5 text-lg text-slate-900 hover:bg-white/90">
        Comprar
      </Button>
    </div>
  );
}