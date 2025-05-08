
import React from 'react';
import { motion } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

interface LightboxModalProps {
  selectedImage: number;
  images: GalleryImageType[];
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const LightboxModal: React.FC<LightboxModalProps> = ({ 
  selectedImage, 
  images, 
  onClose, 
  onPrevious, 
  onNext 
}) => {
  if (selectedImage === null || !images[selectedImage]) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-urbana-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <img 
          src={images[selectedImage].src} 
          alt={images[selectedImage].alt}
          className="w-full h-auto object-contain max-h-[80vh]"
        />
        <button 
          className="absolute top-2 right-2 text-white bg-urbana-black/50 hover:bg-urbana-black p-2 rounded-full"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
          <button 
            className="p-2 bg-urbana-black/50 hover:bg-urbana-black text-white rounded-full"
            onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <button 
            className="p-2 bg-urbana-black/50 hover:bg-urbana-black text-white rounded-full"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div className="text-white text-center py-2">
          {images[selectedImage].alt} - {selectedImage + 1}/{images.length}
        </div>
      </div>
    </motion.div>
  );
};

export default LightboxModal;
