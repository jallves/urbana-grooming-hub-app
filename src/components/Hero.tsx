
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useBannerImages } from './hero/useBannerImages';
import BannerSlide from './hero/BannerSlide';

const Hero: React.FC = () => {
  const { bannerImages, loading } = useBannerImages();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  console.log('Hero component rendering with', bannerImages.length, 'banners');

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  React.useEffect(() => {
    if (bannerImages.length > 1) {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }
  }, [bannerImages.length]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-urbana-gold text-xl">Carregando...</div>
      </div>
    );
  }

  if (bannerImages.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-urbana-black text-white">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Costa Urbana</h1>
          <p className="text-xl mb-8">Barbearia Premium</p>
          <Button 
            className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90"
            onClick={() => window.location.href = '/painel-cliente/login'}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Agora
          </Button>
        </div>
      </div>
    );
  }

  const currentBanner = bannerImages[currentSlide];

  return (
    <div className="relative min-h-screen overflow-hidden bg-urbana-black">
      <motion.div style={{ y }} className="absolute inset-0">
        <AnimatePresence mode="wait">
          <BannerSlide 
            key={currentBanner.id}
            slide={currentBanner} 
            isActive={true} 
          />
        </AnimatePresence>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 z-10" />

      <motion.div 
        style={{ opacity }}
        className="relative z-20 min-h-screen flex items-center justify-center px-4"
      >
        <div className="text-center text-white max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-playfair drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
          >
            {currentBanner.title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl lg:text-3xl mb-8 opacity-90 font-raleway"
          >
            {currentBanner.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button 
              size="lg"
              className="relative overflow-hidden bg-urbana-gold text-urbana-black hover:bg-urbana-gold px-8 py-6 text-lg font-semibold shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] transition-all duration-500 group border-2 border-urbana-gold/50"
              onClick={() => window.location.href = currentBanner.button_link || '/painel-cliente/login'}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-urbana-gold to-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Calendar className="mr-2 h-5 w-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">{currentBanner.button_text || 'Agendar Agora'}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {bannerImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-urbana-gold' : 'bg-white/50'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Hero;
