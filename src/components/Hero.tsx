
import React from 'react';
import { AnimatePresence } from "framer-motion";
import BannerSlide from './hero/BannerSlide';
import HeroContent from './hero/HeroContent';
import NavigationArrows from './hero/NavigationArrows';
import SlideIndicators from './hero/SlideIndicators';
import VintageOverlay from './hero/VintageOverlay';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-urbana-black via-urbana-brown to-urbana-black">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-playfair">Carregando experiência premium...</p>
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
      {/* Modern geometric background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-brown/80 to-urbana-black/90 z-5"></div>
      
      <div className="w-full relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Modern Filter */}
        <AnimatePresence mode="wait">
          {bannerImages.map((slide, index) => (
            <BannerSlide 
              key={slide.id}
              slide={slide}
              isActive={currentSlide === index}
            />
          ))}
        </AnimatePresence>
        
        {/* Modern overlay with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-urbana-black/40 via-transparent to-urbana-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-10"></div>
        
        {/* Navigation Arrows */}
        <NavigationArrows onPrev={prevSlide} onNext={nextSlide} />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="urbana-container text-center px-4">
          <AnimatePresence mode="wait">
            <HeroContent 
              key={currentSlide} 
              slide={bannerImages[currentSlide]} 
              shopName={shopSettings?.shop_name}
            />
          </AnimatePresence>
          
          {/* Modern Slide Indicators */}
          <SlideIndicators 
            count={bannerImages.length}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
          />
        </div>
      </div>

      {/* Modern decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent z-15"></div>
    </div>
  );
};

export default Hero;
