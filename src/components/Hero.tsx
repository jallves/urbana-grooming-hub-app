
import React from 'react';
import { AnimatePresence } from "framer-motion";
import BannerSlide from './hero/BannerSlide';
import HeroContent from './hero/HeroContent';
import NavigationArrows from './hero/NavigationArrows';
import SlideIndicators from './hero/SlideIndicators';
import { useBannerImages } from './hero/useBannerImages';
import { useSlideController } from './hero/useSlideController';
import { useShopSettings } from '@/hooks/useShopSettings';

const Hero: React.FC = () => {
  const { bannerImages, loading } = useBannerImages();
  const { shopSettings } = useShopSettings();
  const { currentSlide, setCurrentSlide, nextSlide, prevSlide } = useSlideController(
    bannerImages?.length || 0
  );
  
  console.log('Hero component rendering with', bannerImages?.length || 0, 'banners');
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-urbana-black via-urbana-brown to-urbana-black relative overflow-hidden">
        {/* Modern loading background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-urbana-gold/5 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
        
        <div className="text-white text-center relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-urbana-gold/30 rounded-full mx-auto"></div>
          </div>
          <p className="text-xl font-playfair bg-gradient-to-r from-urbana-gold via-white to-urbana-gold bg-clip-text text-transparent">
            Carregando experiência premium...
          </p>
          <div className="mt-4 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse" 
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bannerImages || bannerImages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-urbana-black via-urbana-brown to-urbana-black">
        <div className="text-white text-center">
          <p className="text-xl font-playfair">Nenhum banner disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced background with modern geometric elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/95 via-urbana-brown/85 to-urbana-black/95 z-5"></div>
      
      {/* Modern geometric shapes */}
      <div className="absolute inset-0 overflow-hidden z-5">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-urbana-gold/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-urbana-gold/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-urbana-gold/10 rounded-full animate-spin" style={{ animationDuration: '60s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-urbana-gold/5 rounded-full animate-spin" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />
      </div>
      
      <div className="w-full relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Enhanced Filter */}
        <AnimatePresence mode="wait">
          {bannerImages.map((slide, index) => (
            <BannerSlide 
              key={slide.id}
              slide={slide}
              isActive={currentSlide === index}
            />
          ))}
        </AnimatePresence>
        
        {/* Enhanced overlay with modern gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-urbana-black/50 via-transparent to-urbana-black/70 z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10"></div>
        
        {/* Subtle noise texture overlay for premium feel */}
        <div className="absolute inset-0 opacity-20 z-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}></div>
        
        {/* Navigation Arrows with enhanced styling */}
        <NavigationArrows onPrev={prevSlide} onNext={nextSlide} />
      </div>
      
      {/* Content with enhanced positioning */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="urbana-container text-center px-4 relative">
          {/* Decorative elements */}
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-urbana-gold to-transparent opacity-60"></div>
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-t from-transparent via-urbana-gold to-transparent opacity-60"></div>
          
          <AnimatePresence mode="wait">
            <HeroContent 
              key={currentSlide} 
              slide={bannerImages[currentSlide]} 
              shopName={shopSettings?.shop_name}
            />
          </AnimatePresence>
          
          {/* Enhanced Slide Indicators */}
          <SlideIndicators 
            count={bannerImages.length}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
          />
        </div>
      </div>

      {/* Modern bottom fade with enhanced gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-15"></div>
      
      {/* Side decorative elements for premium feel */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-urbana-gold/40 to-transparent z-20"></div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-urbana-gold/40 to-transparent z-20"></div>
    </div>
  );
};

export default Hero;
