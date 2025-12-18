
import React from 'react';
import { cn } from '@/lib/utils';
import { Scissors } from 'lucide-react';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface AuthContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children, className, title, subtitle }) => {
  return (
    <div 
      className={cn(
        'fixed inset-0 w-screen min-h-screen flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden',
        className
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        paddingLeft: 'max(env(safe-area-inset-left, 16px), 16px)',
        paddingRight: 'max(env(safe-area-inset-right, 16px), 16px)',
      }}
    >
      {/* Background Image */}
      <div 
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barbershopBg})` }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-urbana-black/85 via-urbana-black/80 to-urbana-black/90" />
      
      {/* Animated blur effects */}
      <div className="fixed top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="fixed bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />

      {/* Content */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg space-y-4 sm:space-y-5 z-10 px-4 sm:px-0">
        {(title || subtitle) && (
          <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-3">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-urbana-gold/30 animate-glow border border-urbana-gold/30">
                <img 
                  src="/logo-costa-urbana-new.png" 
                  alt="Costa Urbana Logo" 
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>
            {title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-light drop-shadow-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-urbana-light/80 text-xs sm:text-sm md:text-base font-light">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="bg-urbana-black/40 backdrop-blur-2xl border border-urbana-gold/20 rounded-xl sm:rounded-2xl shadow-2xl shadow-urbana-black/50 p-5 sm:p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
