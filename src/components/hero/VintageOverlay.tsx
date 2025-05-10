
import React from 'react';

const VintageOverlay: React.FC = () => {
  return (
    <>
      {/* Luxury Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage: `url('/vintage-pattern.png')`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-urbana-black/50 to-transparent z-10" />
    </>
  );
};

export default VintageOverlay;
