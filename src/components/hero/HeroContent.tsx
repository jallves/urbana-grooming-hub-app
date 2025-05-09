
import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
      className="max-w-3xl mx-auto text-white"
    >
      <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-6">
        {slide.title}<br />
        <span className="text-urbana-gold">{slide.subtitle}</span>
      </h1>
      
      <p className="text-xl md:text-2xl mb-10 text-gray-200">
        {slide.description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black px-8 py-6 text-lg relative overflow-hidden group"
          asChild
        >
          <a href="#appointment">
            <span className="relative z-10">Agendar Horário</span>
            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          </a>
        </Button>
        <Button 
          variant="outline" 
          className="border-white hover:bg-white/10 px-8 py-6 text-lg relative overflow-hidden group"
          asChild
        >
          <a href="#services">
            <span className="relative z-10 text-white transition-colors duration-300">Nossos Serviços</span>
            <span className="absolute inset-0 bg-urbana-gold translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default HeroContent;
