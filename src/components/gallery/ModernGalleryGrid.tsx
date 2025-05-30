
import React from 'react';
import { motion } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

interface ModernGalleryGridProps {
  images: GalleryImageType[];
  onSelectImage: (index: number) => void;
}

const ModernGalleryGrid: React.FC<ModernGalleryGridProps> = ({ 
  images, 
  onSelectImage 
}) => {
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    console.warn('Image failed to load:', target.src);
    // You could set a placeholder image here
    // target.src = '/placeholder-image.jpg';
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    console.log('Image loaded successfully:', target.src);
  };

  console.log('ModernGalleryGrid rendering with', images.length, 'images');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
      {images.map((image, index) => (
        <motion.div
          key={`${image.id}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="relative aspect-square overflow-hidden group cursor-pointer rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          onClick={() => onSelectImage(index)}
        >
          <img 
            src={image.src} 
            alt={image.alt}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          
          {/* Overlay com gradiente e título */}
          <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-4 text-white w-full">
              <h3 className="font-bold text-sm md:text-base line-clamp-2">
                {image.alt}
              </h3>
            </div>
          </div>

          {/* Indicador de loading se a imagem não carregou */}
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center opacity-0 group-[.loading]:opacity-100">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ModernGalleryGrid;
