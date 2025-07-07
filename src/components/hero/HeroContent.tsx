
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Star } from 'lucide-react';
import { BannerImage } from "@/types/settings";

interface HeroContentProps {
  slide: BannerImage;
  shopName?: string;
}

const HeroContent: React.FC<HeroContentProps> = ({ slide, shopName }) => {
  const displayTitle = slide?.title || shopName || 'Barbearia Premium';
  const displaySubtitle = slide?.subtitle || 'Tradição e estilo em cada corte';
  const displayButtonText = slide?.button_text || 'Agendar Agora';
  const buttonLink = slide?.button_link || '/cliente/login';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center text-white space-y-6 max-w-4xl mx-auto px-4"
    >
      <motion.h1 
        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent">
          {displayTitle}
        </span>
      </motion.h1>
      
      <motion.p 
        className="text-lg md:text-xl lg:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {displaySubtitle}
      </motion.p>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Link to={buttonLink}>
          <Button 
            size="lg" 
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold px-8 py-4 text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-urbana-gold hover:border-white"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {displayButtonText}
          </Button>
        </Link>
        
        <div className="flex items-center space-x-1 text-urbana-gold">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-2 text-white/90 font-medium">5.0 (200+ avaliações)</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;
