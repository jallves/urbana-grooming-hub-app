
import React from 'react';
import { cn } from '@/lib/utils';

interface FullScreenContainerProps {
  children: React.ReactNode;
  className?: string;
}

const FullScreenContainer: React.FC<FullScreenContainerProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'min-h-screen w-full bg-white',
      'max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6',
      className
    )}>
      {children}
    </div>
  );
};

export default FullScreenContainer;
