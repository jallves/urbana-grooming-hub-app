
import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Vintage Filter */}
      <div 
        className="absolute inset-0 z-0 bg-urbana-black"
        style={{
          backgroundImage: `url('/hero-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'soft-light',
          filter: 'sepia(15%)',
          opacity: 0.9,
        }}
      />
      
      {/* Vintage Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url('/vintage-pattern.png')`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Content */}
      <div className="urbana-container z-10 text-center">
        <div className="max-w-3xl mx-auto text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-playfair text-5xl md:text-7xl font-bold mb-6"
          >
            Experiência Premium<br />
            <span className="text-urbana-gold">em Barbearia</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 text-gray-200"
          >
            A arte da barbearia tradicional com sofisticação moderna
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
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
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg relative overflow-hidden group"
              asChild
            >
              <a href="#services">
                <span className="relative z-10">Nossos Serviços</span>
                <span className="absolute inset-0 bg-urbana-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              </a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Vintage Decorative Elements */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="w-24 h-24 opacity-30">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L52.5 45L97.5 47.5L52.5 50L50 95L47.5 50L2.5 47.5L47.5 45L50 0Z" fill="currentColor" className="text-urbana-gold" />
          </svg>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-urbana-black to-transparent z-10" />
    </div>
  );
};

export default Hero;
