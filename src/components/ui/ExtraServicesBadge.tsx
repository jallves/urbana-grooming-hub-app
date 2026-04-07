import React from 'react';
import { Plus } from 'lucide-react';

interface ExtraService {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface ExtraServicesBadgeProps {
  extras: ExtraService[] | null | undefined;
  /** 'dark' for barber/totem panels, 'light' for admin panel */
  variant?: 'dark' | 'light';
  /** Show compact (just count) or full (list names) */
  compact?: boolean;
}

const ExtraServicesBadge: React.FC<ExtraServicesBadgeProps> = ({ 
  extras, 
  variant = 'dark',
  compact = false 
}) => {
  if (!extras || !Array.isArray(extras) || extras.length === 0) return null;

  const totalExtra = extras.reduce((sum, s) => sum + (s.preco || 0), 0);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        variant === 'dark' 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}>
        <Plus className="h-2.5 w-2.5" />
        {extras.length} extra{extras.length > 1 ? 's' : ''}
      </span>
    );
  }

  return (
    <div className={`rounded-lg p-2 space-y-1 ${
      variant === 'dark' 
        ? 'bg-emerald-500/10 border border-emerald-500/20' 
        : 'bg-emerald-50 border border-emerald-200'
    }`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
        variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
      }`}>
        <Plus className="h-3 w-3" />
        Serviços Extras
      </div>
      {extras.map((extra, idx) => (
        <div key={extra.id || idx} className="flex items-center justify-between text-xs">
          <span className={variant === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}>
            {extra.nome}
          </span>
          <span className={`font-semibold ${
            variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            R$ {extra.preco?.toFixed(2)}
          </span>
        </div>
      ))}
      <div className={`flex items-center justify-between text-xs pt-1 border-t ${
        variant === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200'
      }`}>
        <span className={`font-bold ${variant === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}`}>
          Total extras
        </span>
        <span className={`font-bold ${variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
          + R$ {totalExtra.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ExtraServicesBadge;
