
import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="text-center mb-16"
    >
      <div className="relative">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="urbana-heading mb-6 relative z-10"
        >
          Nossa <span className="text-urbana-gold">Galeria</span>
        </motion.h2>
        
        {/* Decorative background text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 overflow-hidden">
          <span className="text-8xl font-bold text-urbana-black whitespace-nowrap">
            PORTFOLIO
          </span>
        </div>
      </div>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-lg text-urbana-gray max-w-2xl mx-auto leading-relaxed"
      >
        Descubra a arte e precisão dos nossos trabalhos. Cada corte conta uma história 
        de estilo, tradição e excelência que define a <strong>Barbearia Urbana</strong>.
      </motion.p>
      
      {/* Decorative line */}
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: "5rem" }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="h-1 bg-gradient-to-r from-urbana-gold to-urbana-gold/50 mx-auto mt-8 rounded-full"
      />
    </motion.div>
  );
};

export default GalleryHeader;
