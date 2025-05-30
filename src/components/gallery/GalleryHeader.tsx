
import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="text-center mb-20"
    >
      <div className="relative inline-block">
        {/* Decorative elements */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="absolute -top-6 -left-6 w-3 h-12 bg-urbana-gold/30 rounded-full transform rotate-12"
        ></motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-urbana-black mb-6 relative z-10"
        >
          Nossa <span className="relative">
            <span className="text-urbana-gold">Galeria</span>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-urbana-gold/0 via-urbana-gold to-urbana-gold/0 rounded-full"
            ></motion.div>
          </span>
        </motion.h2>
        
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="absolute -bottom-6 -right-6 w-2 h-8 bg-urbana-gold/40 rounded-full transform -rotate-12"
        ></motion.div>
      </div>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-xl md:text-2xl text-urbana-gray max-w-4xl mx-auto leading-relaxed mt-8"
      >
        Cada imagem conta uma história de <strong className="text-urbana-gold">maestria</strong> e <strong className="text-urbana-gold">paixão</strong>. 
        Descubra o resultado do nosso trabalho meticuloso e da dedicação em cada detalhe.
      </motion.p>
      
      {/* Modern decorative line */}
      <motion.div 
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="relative mx-auto mt-10 w-32"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-urbana-gold/60 to-transparent"></div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-urbana-gold rounded-full"></div>
        <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-urbana-gold/60 rounded-full"></div>
        <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-urbana-gold/60 rounded-full"></div>
      </motion.div>
    </motion.div>
  );
};

export default GalleryHeader;
