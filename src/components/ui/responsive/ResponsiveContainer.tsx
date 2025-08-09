import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'centered' | 'fluid';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md'
}) => {
  const variantClasses = {
    default: 'max-w-7xl mx-auto',
    centered: 'max-w-4xl mx-auto',
    fluid: 'w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 py-4 sm:px-6 lg:px-8',
    lg: 'px-6 py-6 sm:px-8 lg:px-12',
    xl: 'px-8 py-8 sm:px-12 lg:px-16'
  };

  return (
    <div className={cn(
      'w-full',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;