import React from 'react';
import { motion } from 'framer-motion';

interface ArtDecoCornerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ArtDecoCorner: React.FC<ArtDecoCornerProps> = ({ position }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0';
      case 'top-right':
        return 'top-0 right-0 scale-x-[-1]';
      case 'bottom-left':
        return 'bottom-0 left-0 scale-y-[-1]';
      case 'bottom-right':
        return 'bottom-0 right-0 scale-[-1]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
      className={`absolute ${getPositionClasses()} w-24 h-24 pointer-events-none`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Art Deco corner ornament */}
        <path
          d="M 0 0 L 0 30 L 2 28 L 2 2 L 28 2 L 30 0 Z"
          fill="url(#gold-gradient)"
          opacity="0.6"
        />
        <path
          d="M 0 0 L 0 20 L 2 18 L 2 2 L 18 2 L 20 0 Z"
          fill="url(#gold-gradient)"
          opacity="0.8"
        />
        <path
          d="M 0 0 L 0 10 L 2 8 L 2 2 L 8 2 L 10 0 Z"
          fill="url(#gold-gradient)"
        />
        
        {/* Decorative lines */}
        <line x1="0" y1="35" x2="35" y2="0" stroke="url(#gold-gradient)" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="40" x2="40" y2="0" stroke="url(#gold-gradient)" strokeWidth="0.5" opacity="0.3" />
        
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};
