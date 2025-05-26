
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { BannerImage } from "@/types/settings";

interface BannerSlideProps {
  slide: BannerImage;
  isActive: boolean;
}

const BannerSlide: React.FC<BannerSlideProps> = ({ slide, isActive }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!isActive) return null;
  
  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 z-0 rounded-lg overflow-hidden"
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-urbana-black/50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-urbana-black flex items-center justify-center">
          <span className="text-urbana-gold">Erro ao carregar imagem</span>
        </div>
      ) : (
        <div 
          className={`absolute inset-0 bg-urbana-black rounded-lg transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${slide.imageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'normal',
            filter: 'brightness(1)',
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      
      {/* Preload image */}
      <img 
        src={slide.imageUrl}
        alt=""
        className="hidden"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </motion.div>
  );
};

export default BannerSlide;
