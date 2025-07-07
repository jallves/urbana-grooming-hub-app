
import React from 'react';

interface SlideIndicatorsProps {
  count: number;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
}

const SlideIndicators: React.FC<SlideIndicatorsProps> = ({ count, currentSlide, setCurrentSlide }) => {
  return (
    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentSlide(index)}
          className={`w-3 h-3 rounded-full transition-all ${
            index === currentSlide ? "bg-urbana-gold w-8" : "bg-white/60"
          }`}
        />
      ))}
    </div>
  );
};

export default SlideIndicators;
