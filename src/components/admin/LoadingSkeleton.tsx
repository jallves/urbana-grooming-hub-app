
import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
      <div className="h-32 bg-gray-300 rounded"></div>
    </div>
  );
};

export default LoadingSkeleton;
