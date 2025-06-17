
import React from "react";
import { Loader } from "./loader";

interface LoaderPageProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoaderPage = ({ 
  className = '', 
  text = 'Carregando...', 
  fullScreen = false 
}: LoaderPageProps) => {
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
