
import React from 'react';
import { Separator } from "@/components/ui/separator";

const GalleryHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-12">
      <div className="flex items-center w-full max-w-md justify-center mb-6">
        <Separator className="w-16 bg-urbana-gold h-[1px]" />
        <span className="px-4 text-urbana-gold font-semibold uppercase tracking-wider text-sm">Nossa Galeria</span>
        <Separator className="w-16 bg-urbana-gold h-[1px]" />
      </div>
      <h2 className="urbana-heading text-center">Conheça Nosso Trabalho</h2>
      <p className="urbana-subheading text-center">Nossos maiores orgulhos são os resultados que entregamos aos nossos clientes</p>
    </div>
  );
};

export default GalleryHeader;
