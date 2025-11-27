import React from 'react';

interface BarberPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const BarberPageContainer: React.FC<BarberPageContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`w-full space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </div>
  );
};
