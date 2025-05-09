
import React from 'react';
import { AnimatePresence } from "framer-motion";
import BannerSlide from './hero/BannerSlide';
import HeroContent from './hero/HeroContent';
import NavigationArrows from './hero/NavigationArrows';
import SlideIndicators from './hero/SlideIndicators';
import VintageOverlay from './hero/VintageOverlay';
import { useBannerImages } from './hero/useBannerImages';
import { useSlideController } from './hero/useSlideController';

const Hero: React.FC = () => {
  const { bannerImages, loading } = useBannerImages();
  const { currentSlide, setCurrentSlide, nextSlide, prevSlide } = useSlideController(bannerImages.length);
  
  if (loading || bannerImages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-t-4 border-urbana-gold border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="w-[90%] mx-auto relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Vintage Filter */}
        <AnimatePresence mode="wait">
          {bannerImages.map((slide, index) => (
            <BannerSlide 
              key={slide.id}
              slide={slide}
              isActive={currentSlide === index}
            />
          ))}
        </AnimatePresence>
        
        <VintageOverlay />
        
        {/* Navigation Arrows */}
        <NavigationArrows onPrev={prevSlide} onNext={nextSlide} />
      </div>
      
      {/* Content */}
      <div className="urbana-container z-10 text-center absolute">
        <AnimatePresence mode="wait">
          <HeroContent key={currentSlide} slide={bannerImages[currentSlide]} />
        </AnimatePresence>
        
        {/* Slide Indicators */}
        <SlideIndicators 
          count={bannerImages.length}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
        />
      </div>
    </div>
  );
};

export default Hero;
