import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle } from 'lucide-react';

interface TotemProductPaymentPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  total: number;
}

const TotemProductPaymentPixModal: React.FC<TotemProductPaymentPixModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  total
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<'waiting' | 'approved'>('waiting');

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      setStatus('waiting');
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

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}520400005303986540${total.toFixed(2)}5802BR5913URBANA BARBER6009SAO PAULO62070503***6304`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-urbana-black/95 backdrop-blur-xl border-2 border-urbana-gold/30 text-urbana-light">
        <div className="flex flex-col items-center space-y-6 p-6">
          {status === 'waiting' ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-urbana-gold">Pagamento PIX</h2>
                <p className="text-xl text-urbana-light/80">
                  Escaneie o QR Code para pagar
                </p>
              </div>

              <div className="relative p-6 bg-white rounded-2xl">
                <QRCodeSVG
                  value={pixCode}
                  size={280}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="text-center space-y-2">
                <div className="text-4xl font-black text-urbana-gold">
                  R$ {total.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 text-urbana-light/60">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-lg">
                    Aguardando pagamento... ({timeLeft}s)
                  </span>
                </div>
              </div>

              <div className="w-full p-4 bg-urbana-gold/10 border border-urbana-gold/30 rounded-xl">
                <p className="text-sm text-center text-urbana-light/70">
                  Simulação de pagamento - Aprovação automática em {timeLeft} segundos
                </p>
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

export default TotemProductPaymentPixModal;
