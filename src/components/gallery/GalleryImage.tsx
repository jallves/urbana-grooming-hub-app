
import React from 'react';
import { motion } from "framer-motion";

interface GalleryImageProps {
  src: string;
  alt: string;
  delay: number;
  onClick?: () => void;
}

const GalleryImage: React.FC<GalleryImageProps> = ({ src, alt, delay, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative aspect-square overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
        <div className="p-4 text-white">
          <h3 className="font-bold text-lg">{alt}</h3>
        </div>
      </div>
    </motion.div>
  );
};

export default GalleryImage;
