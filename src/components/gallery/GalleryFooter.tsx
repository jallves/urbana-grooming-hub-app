import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="text-center mb-12 px-4"
    >
      {/* Título principal dourado com brilho */}
      <h2 className="text-4xl md:text-5xl font-extrabold font-playfair text-urbana-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">
        Nossa Galeria
      </h2>

      {/* Frase profissional de efeito abaixo do título */}
      <p className="mt-4 max-w-xl mx-auto text-black text-lg font-semibold">
        Capturando a essência da excelência e estilo em cada detalhe.
      </p>
    </motion.div>
  );
};

export default GalleryHeader;
