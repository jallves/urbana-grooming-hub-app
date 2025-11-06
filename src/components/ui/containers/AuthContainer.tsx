
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
      'bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black',
      className
    )}>
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />

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
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-urbana-light/70 text-sm sm:text-base font-light">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="backdrop-blur-sm bg-card/50 border border-urbana-gray/30 rounded-2xl shadow-2xl p-8 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
