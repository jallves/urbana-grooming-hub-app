
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Camera } from 'lucide-react';

interface GalleryImageProps {
  src: string;
  alt: string;
  delay?: number;
  onClick?: () => void;
}

const GalleryImage: React.FC<GalleryImageProps> = ({ 
  src, 
  alt, 
  delay = 0, 
  onClick 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.warn('Erro ao carregar imagem:', src);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Imagem carregada com sucesso:', src);
    setImageLoaded(true);
  };

  // Fallback placeholder image
  const placeholderSrc = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative aspect-square overflow-hidden group cursor-pointer rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-yellow-600/40"
      onClick={onClick}
    >
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-500 text-xl">📷</span>
            </div>
            <p className="text-gray-500 text-sm">Erro ao carregar</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img 
        src={imageError ? placeholderSrc : src}
        alt={alt}
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Overlay com gradiente e título */}
      <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
        <Camera className="text-yellow-600 mb-2" size={32} strokeWidth={1.5} />
        <div className="px-4 text-white w-full text-center">
          <h3 className="font-bold text-sm md:text-base line-clamp-2">
            {alt}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default GalleryImage;
