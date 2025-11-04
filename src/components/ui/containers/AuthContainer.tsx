
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
      'min-h-screen w-full flex items-center justify-center relative overflow-hidden',
      'bg-gradient-to-br from-black via-gray-900 to-black',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(197, 161, 91, 0.1) 35px, rgba(197, 161, 91, 0.1) 70px)`
        }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-4 py-6 relative z-10">
        {(title || subtitle) && (
          <div className="text-center mb-8 space-y-3">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-lg shadow-urbana-gold/30 animate-glow">
                <Scissors className="w-8 h-8 text-black" />
              </div>
            </div>
            {title && (
              <h1 className="text-4xl font-playfair font-bold text-white tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
