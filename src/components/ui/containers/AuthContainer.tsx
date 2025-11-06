
import React from 'react';
import { cn } from '@/lib/utils';
import { Scissors } from 'lucide-react';

interface AuthContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children, className, title, subtitle }) => {
  return (
    <div className={cn(
      'fixed inset-0 w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden p-4',
      'bg-gradient-to-br from-gray-50 via-white to-gray-100',
      className
    )}>
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 opacity-50" />

      {/* Content */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl space-y-5 z-10">
        {(title || subtitle) && (
          <div className="text-center mb-8 space-y-3">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-lg shadow-urbana-gold/30 animate-glow">
                <Scissors className="w-8 h-8 text-black" />
              </div>
            </div>
            {title && (
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-600 text-sm sm:text-base font-light">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
