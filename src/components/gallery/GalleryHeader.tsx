import React from 'react';
import { motion } from "framer-motion";

const GalleryFooter: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="mt-16 text-center px-4"
    >
      {/* Título */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-4xl font-extrabold text-black mb-4 cursor-default"
      >
        Nossa Galeria
      </motion.h2>

      {/* Frase profissional */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-black text-lg font-medium cursor-default"
      >
        Capturando a essência da excelência e estilo em cada detalhe.
      </motion.p>
    </motion.div>
  );
};

export default GalleryFooter;

