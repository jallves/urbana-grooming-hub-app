
import React from 'react';

export const LoaderPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white loader-page">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-urbana-gold rounded-full"></div>
        <p className="text-urbana-gold text-lg font-medium">Carregando...</p>
      </div>
    </div>
  );
};
