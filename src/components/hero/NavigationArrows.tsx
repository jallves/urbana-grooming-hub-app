
import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

const NavigationArrows: React.FC<NavigationArrowsProps> = ({ onPrev, onNext }) => {
  return (
    <>
      <button 
        onClick={onPrev} 
        className="absolute left-4 z-20 text-white opacity-60 hover:opacity-100 transition-opacity rounded-full p-2 bg-black/20 hover:bg-black/40"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={onNext} 
        className="absolute right-4 z-20 text-white opacity-60 hover:opacity-100 transition-opacity rounded-full p-2 bg-black/20 hover:bg-black/40"
      >
        <ChevronRight size={24} />
      </button>
    </>
  );
};

export default NavigationArrows;
