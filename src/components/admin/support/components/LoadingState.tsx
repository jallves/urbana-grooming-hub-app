
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default LoadingState;
