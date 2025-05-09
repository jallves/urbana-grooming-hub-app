
import React from 'react';
import type { GalleryImage as GalleryImageType } from "@/types/settings";
import GalleryImage from './GalleryImage';

interface GalleryGridProps {
  images: GalleryImageType[];
  onSelectImage: (index: number) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onSelectImage }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <GalleryImage 
          key={index} 
          src={image.src} 
          alt={image.alt} 
          delay={index * 0.1} 
          onClick={() => onSelectImage(index)}
        />
      ))}
    </div>
  );
};

export default GalleryGrid;
