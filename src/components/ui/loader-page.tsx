// src/components/ui/loader-page.tsx
import React from "react";
import { Loader } from "./loader"; // Corrigido o caminho de importação

interface LoaderPageProps {
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoaderPage: React.FC<LoaderPageProps> = ({ 
  className = '', 
  text = 'Carregando...',
  fullScreen = false
}) => {
  return (
    <div className={`
      ${fullScreen ? 'min-h-screen' : 'min-h-[300px]'} 
      flex flex-col items-center justify-center py-16 ${className}
    `}>
      <Loader size="lg" />
      {text && (
        <span className="text-stone-300 text-base mt-4 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};