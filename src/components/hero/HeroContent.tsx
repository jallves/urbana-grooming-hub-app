
import React from 'react';
import { motion } from "framer-motion";
import { BannerImage } from "@/types/settings";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroContentProps {
  slide: BannerImage;
  shopName?: string;
}

const HeroContent: React.FC<HeroContentProps> = ({ slide, shopName }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-5xl mx-auto text-white px-4 md:px-0"
    >
      {/* Modern badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="inline-flex items-center gap-2 bg-urbana-gold/20 backdrop-blur-sm border border-urbana-gold/30 rounded-full px-6 py-2 mb-8"
      >
        <div className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse"></div>
        <span className="text-urbana-gold font-medium text-sm uppercase tracking-wider">
          Experiência Premium
        </span>
      </motion.div>

      {/* Main heading with modern typography */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="font-playfair text-4xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight"
      >
        <span className="block text-white drop-shadow-2xl">
          {slide.title}
        </span>
        <span className="block text-urbana-gold drop-shadow-2xl bg-gradient-to-r from-urbana-gold to-yellow-400 bg-clip-text text-transparent">
          {slide.subtitle}
        </span>
      </motion.h1>
      
      {/* Enhanced description */}
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="text-xl md:text-2xl lg:text-3xl mb-12 text-white/90 drop-shadow-lg max-w-3xl mx-auto leading-relaxed"
      >
        {slide.description}
      </motion.p>

      {/* Modern CTA buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <Link 
          to="/agendar"
          className="group relative inline-flex items-center gap-3 bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-bold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-lg">Agendar Horário</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <a 
          href="#services"
          className="group inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:border-white/50 font-medium px-8 py-4 rounded-full transition-all duration-300 hover:scale-105"
        >
          <span className="text-lg">Nossos Serviços</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;
