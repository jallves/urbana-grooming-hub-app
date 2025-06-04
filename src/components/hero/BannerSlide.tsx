
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { BannerImage } from "@/types/settings";

interface BannerSlideProps {
  slide: BannerImage;
  isActive: boolean;
}

const BannerSlide: React.FC<BannerSlideProps> = ({ slide, isActive }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when slide changes
    setIsLoaded(false);
    setHasError(false);
    
    // Preload the image
    if (slide?.image_url) {
      const img = new Image();
      img.src = slide.image_url;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
    }
  }, [slide]);

  if (!isActive) return null;
  
  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 z-0"
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-urbana-black/50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-urbana-black flex items-center justify-center">
          <span className="text-urbana-gold">Erro ao carregar imagem: {slide.image_url}</span>
        </div>
      ) : (
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${slide.image_url}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </motion.div>
  );
};

export default BannerSlide;
