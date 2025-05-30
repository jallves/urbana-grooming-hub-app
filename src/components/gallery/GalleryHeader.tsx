
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
        
        {/* Decorative elements - modern barber theme */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <div className="flex items-center gap-8">
            <div className="w-1 h-16 bg-urbana-gold rotate-12"></div>
            <div className="w-8 h-1 bg-urbana-black"></div>
            <div className="w-1 h-12 bg-urbana-gold -rotate-12"></div>
          </div>
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
      
      {/* Modern decorative line with barber-inspired details */}
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: "8rem" }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="relative mx-auto mt-8"
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-urbana-gold to-transparent rounded-full"></div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-urbana-gold rounded-full"></div>
      </motion.div>
    </motion.div>
  );
};

export default GalleryHeader;
