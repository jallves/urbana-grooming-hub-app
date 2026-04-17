import React from 'react';
import { cn } from '@/lib/utils';

interface PaymentMethodBarProps {
  /** Mapa { método: total } */
  data: Record<string, number>;
  /** Cor primária da barra (Tailwind) — controla o tema do relatório */
  accent?: 'teal' | 'rose' | 'emerald' | 'indigo';
  /** Título do bloco */
  title?: string;
}

const ACCENT_PALETTES: Record<string, string[]> = {
  teal:    ['bg-teal-600',    'bg-teal-500',    'bg-teal-400',    'bg-cyan-500',    'bg-blue-500',    'bg-sky-500',    'bg-emerald-500'],
  rose:    ['bg-rose-600',    'bg-rose-500',    'bg-pink-500',    'bg-fuchsia-500', 'bg-purple-500',  'bg-orange-500', 'bg-amber-500'],
  emerald: ['bg-emerald-600', 'bg-emerald-500', 'bg-teal-500',    'bg-green-500',   'bg-lime-500',    'bg-cyan-500',   'bg-blue-500'],
  indigo:  ['bg-indigo-600',  'bg-indigo-500',  'bg-blue-500',    'bg-violet-500',  'bg-purple-500',  'bg-pink-500',   'bg-rose-500'],
};

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PaymentMethodBar: React.FC<PaymentMethodBarProps> = ({
  data,
  accent = 'teal',
  title = 'Distribuição por forma de pagamento',
}) => {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const palette = ACCENT_PALETTES[accent];

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">{title}</p>
        <p className="text-xs text-gray-400 text-center py-2">Sem dados no período</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">{title}</p>
        <span className="text-[10px] text-gray-500">Total: {formatBRL(total)}</span>
      </div>

      {/* Barra horizontal segmentada */}
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100">
        {entries.map(([method, value], idx) => {
          const pct = (value / total) * 100;
          return (
            <div
              key={method}
              className={cn(palette[idx % palette.length], 'h-full transition-all')}
              style={{ width: `${pct}%` }}
              title={`${method}: ${formatBRL(value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 pt-1">
        {entries.map(([method, value], idx) => {
          const pct = (value / total) * 100;
          return (
            <div key={method} className="flex items-center gap-1.5 text-[11px] min-w-0">
              <span className={cn(palette[idx % palette.length], 'h-2.5 w-2.5 rounded-sm shrink-0')} />
              <span className="text-gray-700 truncate">{method}</span>
              <span className="text-gray-500 ml-auto whitespace-nowrap">
                {pct.toFixed(0)}% · {formatBRL(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodBar;
