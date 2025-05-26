
import React, { useState } from 'react';
import { motion } from "framer-motion";

interface GalleryImageProps {
  src: string;
  alt: string;
  delay: number;
  onClick?: () => void;
}

const GalleryImage: React.FC<GalleryImageProps> = ({ src, alt, delay, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative aspect-square overflow-hidden group cursor-pointer rounded-md shadow-md"
      onClick={onClick}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Erro ao carregar</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
        <div className="p-4 text-white">
          <h3 className="font-bold text-lg">{alt}</h3>
        </div>
      </div>
    </motion.div>
  );
};

export default GalleryImage;
