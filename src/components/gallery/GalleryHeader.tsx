import React from 'react';
import { motion } from "framer-motion";

const GalleryFooter: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="mt-16 text-center"
    >
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative inline-block text-black text-lg font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] cursor-default"
      >
        Acompanhe nossos trabalhos e novidades
        <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-urbana-gold transition-all duration-500 group-hover:w-full"></span>
      </motion.p>
    </motion.div>
  );
};

export default GalleryFooter;

