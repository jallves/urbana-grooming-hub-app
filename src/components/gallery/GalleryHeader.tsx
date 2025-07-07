
import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
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
        className="text-4xl font-extrabold text-urbana-black mb-4 cursor-default drop-shadow-lg"
        style={{
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.8)'
        }}
      >
        Nossa Galeria
      </motion.h2>

      {/* Frase profissional */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-urbana-black text-lg font-medium cursor-default drop-shadow-md"
        style={{
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2), 0 0 6px rgba(255, 255, 255, 0.6)'
        }}
      >
        Capturando a essência da excelência e estilo em cada detalhe.
      </motion.p>
    </motion.div>
  );
};

export default GalleryHeader;
