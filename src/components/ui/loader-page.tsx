
import React from "react";

const LoaderPage: React.FC = () => {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mb-4"></div>
      <span className="text-stone-300 text-base mt-2">Carregando...</span>
    </div>
  );
};

export { LoaderPage };
