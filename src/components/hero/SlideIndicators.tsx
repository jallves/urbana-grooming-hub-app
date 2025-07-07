
import React from 'react';
import { motion } from 'framer-motion';

interface SlideIndicatorsProps {
  count: number;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
}

const SlideIndicators: React.FC<SlideIndicatorsProps> = ({ count, currentSlide, setCurrentSlide }) => {
  return (
    <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 z-10">
      {Array.from({ length: count }).map((_, index) => (
        <motion.button
          key={index}
          onClick={() => setCurrentSlide(index)}
          className={`relative h-3 rounded-full transition-all duration-300 cursor-pointer group ${
            index === currentSlide 
              ? "bg-urbana-gold w-10 shadow-lg shadow-urbana-gold/50" 
              : "bg-white/40 w-3 hover:bg-white/60"
          }`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Active indicator glow */}
          {index === currentSlide && (
            <motion.div
              className="absolute inset-0 bg-urbana-gold rounded-full blur-sm opacity-60"
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Hover effect for inactive indicators */}
          {index !== currentSlide && (
            <div className="absolute inset-0 bg-urbana-gold rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default SlideIndicators;
