import React from 'react';
import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface TotemNumericKeypadProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  clearLabel?: string;
}

export const TotemNumericKeypad: React.FC<TotemNumericKeypadProps> = ({
  onNumberClick,
  onClear,
  onBackspace,
  clearLabel = "Limpar"
}) => {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', clearLabel, '0', 'backspace'];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {numbers.map((num) => (
        <Button
          key={num}
          variant="ghost"
          onClick={() => {
            if (num === clearLabel) {
              onClear();
            } else if (num === 'backspace') {
              onBackspace();
            } else {
              onNumberClick(num);
            }
          }}
          className="h-14 sm:h-16 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold !bg-transparent text-urbana-gold border-2 border-urbana-gold/30 hover:!bg-urbana-gold/10 hover:border-urbana-gold/50 active:!bg-urbana-gold/20 active:border-urbana-gold transition-all duration-200 shadow-lg backdrop-blur-sm rounded-lg"
        >
          {num === 'backspace' ? (
            <Delete className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          ) : (
            num
          )}
        </Button>
      ))}
    </div>
  );
};
