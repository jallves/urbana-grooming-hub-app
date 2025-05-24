
import React from 'react';
import { motion } from "framer-motion";
import { BannerImage } from "@/types/settings";

interface HeroContentProps {
  slide: BannerImage;
  shopName?: string;
}

const HeroContent: React.FC<HeroContentProps> = ({ slide, shopName }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto text-white px-4 md:px-0"
    >
      <h1 className="font-playfair text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-shadow drop-shadow-lg">
        {slide.title}<br />
        <span className="text-urbana-gold">{slide.subtitle}</span>
      </h1>
      
      <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-10 text-white drop-shadow-lg">
        {slide.description}
      </p>
    </motion.div>
  );
};

export default HeroContent;
