
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center py-8">
      <div 
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        role="status"
        aria-label="Carregando"
      >
        <span className="sr-only">Carregando tickets...</span>
      </div>
    </div>
  );
};

export default LoadingState;
