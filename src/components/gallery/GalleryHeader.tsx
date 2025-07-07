import React from 'react';
import { motion } from "framer-motion";

const GalleryFooter: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mt-16 text-center"
    >
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        viewport={{ once: true }}
        className="text-black text-sm"
      >
        Acompanhe nossos trabalhos e novidades
      </motion.p>
    </motion.div>
  );
};

export default GalleryFooter;
