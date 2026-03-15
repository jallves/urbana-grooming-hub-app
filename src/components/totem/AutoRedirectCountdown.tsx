import React from 'react';
import { Clock } from 'lucide-react';

interface AutoRedirectCountdownProps {
  countdown: number;
  label?: string;
}

/**
 * Componente visual de countdown para auto-redirect do totem.
 */
export const AutoRedirectCountdown: React.FC<AutoRedirectCountdownProps> = ({
  countdown,
  label = 'segundos para voltar ao início',
}) => {
  return (
    <div className="flex items-center justify-center gap-2 pt-3 animate-fade-in">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-urbana-gold/20 border border-urbana-gold/40 flex items-center justify-center">
        <span className="text-lg sm:text-xl font-bold text-urbana-gold font-mono">
          {countdown}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-urbana-gold/60">
        {label}
      </p>
    </div>
  );
};
