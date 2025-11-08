import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TimeoutWarningProps {
  open: boolean;
  timeLeft: string;
  onExtend: () => void;
}

export const TimeoutWarning: React.FC<TimeoutWarningProps> = ({
  open,
  timeLeft,
  onExtend,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl bg-gradient-to-br from-urbana-brown via-urbana-black to-urbana-brown border-4 border-urbana-gold">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-4 text-3xl text-urbana-light">
            <AlertCircle className="w-12 h-12 text-yellow-500 animate-pulse" />
            Ainda está aí?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xl text-urbana-light/80 mt-4">
            Por inatividade, você será desconectado em:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-4 bg-urbana-black/50 px-12 py-6 rounded-2xl border-2 border-urbana-gold/30">
            <Clock className="w-16 h-16 text-urbana-gold animate-pulse" />
            <span className="text-6xl font-bold text-urbana-gold font-mono">
              {timeLeft}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            onClick={onExtend}
            size="lg"
            className="w-full h-20 text-2xl bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:opacity-90 text-urbana-dark font-bold shadow-lg shadow-urbana-gold/50"
          >
            Continuar Usando
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
