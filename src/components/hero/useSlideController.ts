
import { useState, useEffect } from 'react';

export const useSlideController = (totalSlides: number) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-rotation for slides
  useEffect(() => {
    if (totalSlides > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return {
    currentSlide,
    setCurrentSlide,
    nextSlide,
    prevSlide
  };
};
