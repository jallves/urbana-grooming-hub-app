import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBanners } from '@/hooks/useBanners';
import BannerSlide from './hero/BannerSlide';
import { RippleButton } from '@/components/ui/ripple-button';
import { Button } from '@/components/ui/button';

const Hero: React.FC = () => {
  const { banners: bannerImages, loading, error, refetch } = useBanners();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-urbana-gold text-lg">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  // Error state - Never show error, always show content
  if (false) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-center px-4 max-w-md">
          <div className="w-20 h-20 bg-urbana-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-urbana-gold" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Costa Urbana</h2>
          <p className="text-urbana-gold/70 mb-6">{error || 'Não foi possível carregar este conteúdo agora.'}</p>
          <Button
            onClick={() => refetch()}
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Success state
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
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 md:mb-8 leading-tight sm:leading-[0.95] font-playfair tracking-tight px-2"
            style={{
              textShadow: '0 0 40px rgba(255, 215, 0, 0.4), 0 0 80px rgba(255, 215, 0, 0.2), 0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
          >
            {currentBanner.title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg md:text-2xl lg:text-3xl mb-6 sm:mb-8 md:mb-10 font-light font-raleway tracking-wide px-2"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)'
            }}
          >
            {currentBanner.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <RippleButton 
              className="relative overflow-hidden bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold hover:from-yellow-400 hover:via-urbana-gold hover:to-yellow-400 text-urbana-black px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 text-base sm:text-lg font-bold shadow-[0_0_40px_rgba(255,215,0,0.5),inset_0_2px_8px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,215,0,0.7),0_0_100px_rgba(255,215,0,0.4),inset_0_2px_12px_rgba(255,255,255,0.3)] transition-all duration-500 group border-2 border-yellow-300/30 hover:border-yellow-300/50 backdrop-blur-sm hover:scale-105 rounded-lg"
              onClick={() => navigate(currentBanner.button_link || '/painel-cliente/login')}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Calendar className="inline mr-2 h-5 w-5 sm:h-6 sm:w-6 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
              <span className="relative z-10 drop-shadow-sm">{currentBanner.button_text || 'Agendar Agora'}</span>
            </RippleButton>
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
