import React from 'react';
import { motion } from "framer-motion";

const GalleryHeader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="text-center mb-20 px-4 max-w-4xl mx-auto"
      style={{ color: '#fff7d1' }}
    >
      <div className="relative inline-block">
        {/* Decorative elements gold glow */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="absolute -top-6 -left-6 w-3 h-12 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 opacity-30 shadow-[0_0_12px_rgba(255,215,0,0.7)]"
          style={{ transformOrigin: 'center' }}
        />
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold relative z-10"
          style={{ color: '#ffd54f' }}
        >
          Nossa{' '}
          <span className="relative inline-block">
            <span className="text-yellow-400">Galeria</span>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 h-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.8))' }}
            />
          </span>
        </motion.h2>
        
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="absolute -bottom-6 -right-6 w-2 h-8 rounded-full bg-gradient-to-t from-yellow-500 to-yellow-400 opacity-40 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
          style={{ transformOrigin: 'center' }}
        />
      </div>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mt-8"
        style={{ color: '#fff7d1' }}
      >
        Cada imagem conta uma história de{' '}
        <strong className="text-yellow-400 font-semibold">maestria</strong> e{' '}
        <strong className="text-yellow-400 font-semibold">paixão</strong>. 
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
        <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full" 
          style={{ filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.8))' }}
        ></div>
        <div className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(255,215,0,0.9)]" 
          style={{ transform: 'translate(-50%, -50%)' }} 
        />
        <div className="absolute left-1/4 top-1/2 w-1 h-1 rounded-full bg-yellow-300 opacity-70" 
          style={{ transform: 'translate(-50%, -50%)' }}
        />
        <div className="absolute right-1/4 top-1/2 w-1 h-1 rounded-full bg-yellow-300 opacity-70" 
          style={{ transform: 'translate(50%, -50%)' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default GalleryHeader;

