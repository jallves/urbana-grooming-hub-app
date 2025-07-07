import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
  return (
    <div className="bg-white py-24 px-4 sm:px-6 lg:px-8"> {/* fundo branco visível */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center max-w-4xl mx-auto"
      >
        <div className="relative inline-block">
          {/* Decoração dourada superior esquerda */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="absolute -top-6 -left-6 w-3 h-12 bg-yellow-400/30 rounded-full shadow-[0_0_12px_rgba(255,215,0,0.5)]"
          />

          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-6 relative z-10"
          >
            Nossa{" "}
            <span className="relative inline-block">
              <span className="text-black hover:text-yellow-500 transition-colors duration-300">
                Galeria
              </span>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.8 }}
                viewport={{ once: true }}
                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 rounded-full"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' }}
              />
            </span>
          </motion.h2>

          {/* Decoração dourada inferior direita */}
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="absolute -bottom-6 -right-6 w-2 h-8 bg-yellow-400/40 rounded-full"
          />
        </div>

        {/* Frase com destaque dourado nos termos */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl text-black max-w-3xl mx-auto leading-relaxed mt-8"
        >
          Cada imagem conta uma história de{" "}
          <strong className="text-black" style={{ filter: 'drop-shadow(0 0 2px gold)' }}>
            maestria
          </strong>{" "}
          e{" "}
          <strong className="text-black" style={{ filter: 'drop-shadow(0 0 2px gold)' }}>
            paixão
          </strong>. Descubra o resultado do nosso trabalho meticuloso e da dedicação em cada detalhe.
        </motion.p>

        {/* Linha decorativa com ponto dourado */}
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="relative mx-auto mt-10 w-32"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full" 
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.6))' }}
          ></div>
          <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_6px_rgba(255,215,0,0.7)]" 
            style={{ transform: 'translate(-50%, -50%)' }} 
          />
          <div className="absolute left-1/4 top-1/2 w-1 h-1 bg-yellow-300 opacity-70 rounded-full" 
            style={{ transform: 'translate(-50%, -50%)' }}
          />
          <div className="absolute right-1/4 top-1/2 w-1 h-1 bg-yellow-300 opacity-70 rounded-full" 
            style={{ transform: 'translate(50%, -50%)' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GalleryHeader;
