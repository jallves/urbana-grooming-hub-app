import React from 'react';

export const PainelClienteLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-urbana-black">
      <div className="text-center space-y-6 animate-fade-in">
        {/* Logo/Nome da Barbearia */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-urbana-gold tracking-wider">
            COSTA URBANA
          </h1>
          <p className="text-urbana-light/60 text-sm tracking-widest uppercase">
            Barbearia Premium
          </p>
        </div>

        {/* Spinner animado */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-urbana-gold"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-l-2 border-r-2 border-urbana-gold/20"></div>
          </div>
        </div>

        {/* Texto de carregamento */}
        <p className="text-urbana-light/70 text-sm animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
};
