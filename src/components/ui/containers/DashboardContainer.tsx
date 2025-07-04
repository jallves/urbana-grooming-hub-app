
import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'screen-xl' | 'screen-2xl' | 'full';
  spacing?: 'sm' | 'md' | 'lg';
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ 
  children, 
  className,
  maxWidth = 'screen-xl',
  spacing = 'md'
}) => {
  const spacingClasses = {
    sm: 'px-3 py-4 space-y-4',
    md: 'px-4 py-6 space-y-6',
    lg: 'px-6 py-8 space-y-8'
  };

  const maxWidthClasses = {
    'screen-xl': 'max-w-screen-xl',
    'screen-2xl': 'max-w-screen-2xl',
    'full': 'max-w-full'
  };

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidthClasses[maxWidth],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};

export default DashboardContainer;
