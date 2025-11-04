
import React from 'react';
import { cn } from '@/lib/utils';

interface AuthContainerProps {
  children: React.ReactNode;
  className?: string;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'min-h-screen w-full flex items-center justify-center',
      'px-4 py-6',
      className
    )}>
      <div className="max-w-md space-y-6">
        {children}
      </div>
    </div>
  );
};

export default AuthContainer;
