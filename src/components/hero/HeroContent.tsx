
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Sparkles } from 'lucide-react';
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
      className="text-center text-white space-y-8 max-w-5xl mx-auto px-4 relative"
    >
      {/* Premium decorative elements */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 opacity-60">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-urbana-gold to-transparent"></div>
        <Sparkles className="w-4 h-4 text-urbana-gold" />
        <div className="w-8 h-px bg-gradient-to-l from-transparent via-urbana-gold to-transparent"></div>
      </div>

      <motion.h1 
        className="text-4xl md:text-6xl lg:text-8xl font-bold leading-tight relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent drop-shadow-2xl">
          {displayTitle}
        </span>
        {/* Text glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent blur-sm opacity-30 -z-10">
          {displayTitle}
        </div>
      </motion.h1>
      
      <motion.p 
        className="text-xl md:text-2xl lg:text-3xl text-gray-200 font-light max-w-3xl mx-auto leading-relaxed relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {displaySubtitle}
        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-urbana-gold to-transparent"></span>
      </motion.p>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Link to={buttonLink}>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold hover:from-yellow-400 hover:via-urbana-gold hover:to-yellow-400 text-urbana-black font-bold px-10 py-6 text-xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-white/40 relative overflow-hidden group"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Calendar className="mr-3 h-6 w-6 relative z-10" />
            <span className="relative z-10">{displayButtonText}</span>
          </Button>
        </Link>
        
        <motion.div 
          className="flex items-center space-x-2 text-urbana-gold bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-urbana-gold/20"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 + star * 0.1, duration: 0.3 }}
              >
                <Star className="h-5 w-5 fill-current text-urbana-gold" />
              </motion.div>
            ))}
          </div>
          <span className="ml-3 text-white/90 font-medium text-lg">5.0</span>
          <span className="text-white/70 font-normal">(200+ avaliações)</span>
        </motion.div>
      </motion.div>

      {/* Bottom decorative line */}
      <motion.div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-urbana-gold to-transparent opacity-40"
        initial={{ width: 0 }}
        animate={{ width: 128 }}
        transition={{ delay: 1, duration: 0.8 }}
      ></motion.div>
    </motion.div>
  );
};

export default HeroContent;
