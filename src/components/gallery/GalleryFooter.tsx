import React from 'react';
import { motion } from "framer-motion";
import { Instagram, ExternalLink } from "lucide-react";

const GalleryFooter: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mt-16 text-center"
    >
      <motion.a 
        href="https://www.instagram.com/costaurbanavv?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
        target="_blank" 
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group inline-flex items-center gap-3 bg-gradient-to-r from-urbana-gold to-black-400 hover:from-urbana-gold/90 hover:to-black-400/90 text-black font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]"
      >
        <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
        <span className="text-lg drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]">
          Veja mais no nosso Instagram
        </span>
        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
      </motion.a>
      
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        viewport={{ once: true }}
        className="mt-4 text-black text-sm drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]"
      >
        Acompanhe nossos trabalhos e novidades
      </motion.p>
    </motion.div>
  );
};

export default GalleryFooter;
