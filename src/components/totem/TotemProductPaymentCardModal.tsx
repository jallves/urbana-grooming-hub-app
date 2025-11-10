import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';

interface TotemProductPaymentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  total: number;
  paymentType: 'credit' | 'debit';
}

const TotemProductPaymentCardModal: React.FC<TotemProductPaymentCardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  total,
  paymentType
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<'processing' | 'approved'>('processing');

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      setStatus('processing');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus('approved');
          setTimeout(() => {
            onSuccess();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onSuccess]);

  const paymentTypeLabel = paymentType === 'credit' ? 'Crédito' : 'Débito';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-urbana-black/95 backdrop-blur-xl border-2 border-urbana-gold/30 text-urbana-light">
        <div className="flex flex-col items-center space-y-6 p-6">
          {status === 'processing' ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-urbana-gold">
                  Pagamento no Cartão
                </h2>
                <p className="text-xl text-urbana-light/80">
                  {paymentTypeLabel}
                </p>
              </div>

              <div className="relative">
                <div className="absolute -inset-8 bg-urbana-gold/20 blur-3xl" />
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center animate-pulse">
                  <CreditCard className="w-20 h-20 text-urbana-black" strokeWidth={2.5} />
                </div>
              </div>

              <div className="text-center space-y-3">
                <div className="text-4xl font-black text-urbana-gold">
                  R$ {total.toFixed(2)}
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-urbana-gold" />
                  <span className="text-xl text-urbana-light">
                    Processando pagamento...
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="p-4 bg-urbana-gold/10 border border-urbana-gold/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-urbana-light/70">Forma de pagamento:</span>
                    <span className="font-bold text-urbana-gold">{paymentTypeLabel}</span>
                  </div>
                </div>

                <div className="p-4 bg-urbana-gold/10 border border-urbana-gold/30 rounded-xl">
                  <p className="text-sm text-center text-urbana-light/70">
                    Simulação de pagamento - Aprovação em {timeLeft} segundos
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-6 py-8">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-emerald-400 to-green-500 blur-2xl opacity-50" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                  Pagamento Aprovado!
                </h3>
                <p className="text-xl text-urbana-light/80">
                  Processando compra...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TotemProductPaymentCardModal;
