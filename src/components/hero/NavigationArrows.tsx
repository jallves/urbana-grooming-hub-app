
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

const NavigationArrows: React.FC<NavigationArrowsProps> = ({ onPrev, onNext }) => {
  return (
    <>
      <motion.button 
        onClick={onPrev} 
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 text-white/80 hover:text-white transition-all duration-300 group"
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 group-hover:bg-black/40 group-hover:border-urbana-gold/30 transition-all duration-300">
          <ChevronLeft size={28} />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-urbana-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.button>
      
      <motion.button 
        onClick={onNext} 
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 text-white/80 hover:text-white transition-all duration-300 group"
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 group-hover:bg-black/40 group-hover:border-urbana-gold/30 transition-all duration-300">
          <ChevronRight size={28} />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-urbana-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.button>
    </>
  );
};

export default NavigationArrows;
