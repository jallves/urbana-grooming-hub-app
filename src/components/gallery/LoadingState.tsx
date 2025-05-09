
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <section id="gallery" className="urbana-section py-24">
      <div className="urbana-container text-center">
        <div className="w-16 h-16 border-t-4 border-urbana-gold border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p>Carregando galeria...</p>
      </div>
    </section>
  );
};

export default LoadingState;
