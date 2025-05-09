
import React from 'react';
import { motion } from "framer-motion";
import { BannerImage } from "@/types/settings";

interface BannerSlideProps {
  slide: BannerImage;
  isActive: boolean;
}

const BannerSlide: React.FC<BannerSlideProps> = ({ slide, isActive }) => {
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
      <div 
        className="absolute inset-0 bg-urbana-black"
        style={{
          backgroundImage: `url('${slide.imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'soft-light',
          filter: 'sepia(15%)',
          opacity: 0.9,
        }}
      />
    </motion.div>
  );
};

export default BannerSlide;
