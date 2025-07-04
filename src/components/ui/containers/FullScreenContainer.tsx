
import React from 'react';
import { cn } from '@/lib/utils';

interface FullScreenContainerProps {
  children: React.ReactNode;
  className?: string;
}

const FullScreenContainer: React.FC<FullScreenContainerProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'min-h-screen w-full',
      'max-w-screen-xl mx-auto px-4 py-6 space-y-6',
      className
    )}>
      {children}
    </div>
  );
};

export default FullScreenContainer;
