import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Printer, 
  CheckCircle2, 
  Loader2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface TotemReceiptOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  clientName: string;
  clientEmail?: string;
  total: number;
  onSendEmail: () => Promise<boolean>;
  onPrint?: () => Promise<boolean>; // Futuro: impressora térmica
  isPrintAvailable?: boolean; // Flag para quando impressora estiver disponível
}

type ReceiptStatus = 'idle' | 'sending' | 'printing' | 'success' | 'error';

const TotemReceiptOptionsModal: React.FC<TotemReceiptOptionsModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  clientName,
  clientEmail,
  total,
  onSendEmail,
  onPrint,
  isPrintAvailable = false
}) => {
  const [status, setStatus] = useState<ReceiptStatus>('idle');
  const [emailSent, setEmailSent] = useState(false);
  const [printed, setPrinted] = useState(false);

  const handleSendEmail = async () => {
    if (!clientEmail) {
      toast.error('E-mail não cadastrado', {
        description: 'Informe seu e-mail na recepção para receber comprovantes.'
      });
      return;
    }

    setStatus('sending');
    
    try {
      const success = await onSendEmail();
      
      if (success) {
        setEmailSent(true);
        setStatus('success');
        toast.success('Comprovante enviado!', {
          description: `Enviado para ${clientEmail}`
        });
        
        // Aguardar um pouco e finalizar
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setStatus('error');
        toast.error('Erro ao enviar comprovante');
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      setStatus('error');
      toast.error('Erro ao enviar comprovante');
    }
  };

  const handleSendAndPrint = async () => {
    if (!clientEmail) {
      toast.error('E-mail não cadastrado');
      return;
    }

    setStatus('sending');
    
    try {
      // Primeiro envia o e-mail
      const emailSuccess = await onSendEmail();
      
      if (emailSuccess) {
        setEmailSent(true);
        
        // Depois imprime (se disponível)
        if (onPrint && isPrintAvailable) {
          setStatus('printing');
          const printSuccess = await onPrint();
          
          if (printSuccess) {
            setPrinted(true);
            setStatus('success');
            toast.success('Comprovante enviado e impresso!');
          } else {
            // E-mail enviado mas impressão falhou
            setStatus('success');
            toast.warning('E-mail enviado, mas houve erro na impressão');
          }
        } else {
          // Sem impressora - só e-mail
          setStatus('success');
          toast.success('Comprovante enviado por e-mail!');
        }
        
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setStatus('error');
        toast.error('Erro ao enviar comprovante');
      }
    } catch (error) {
      console.error('Erro no envio/impressão:', error);
      setStatus('error');
      toast.error('Erro ao processar comprovante');
    }
  };

  const handleSkip = () => {
    // Permitir pular apenas se não tem e-mail
    if (!clientEmail) {
      onComplete();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const firstName = clientName?.split(' ')[0] || 'Cliente';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-urbana-black-soft/95 backdrop-blur-xl border-2 border-urbana-gold/30">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            {status === 'success' ? '✅ Pagamento Confirmado!' : `${firstName}, como deseja receber o comprovante?`}
          </DialogTitle>
          <DialogDescription className="text-urbana-light/70">
            {status === 'success' 
              ? 'Obrigado pela preferência!'
              : `Total: ${formatCurrency(total)}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {status === 'idle' && (
            <>
              {/* Opção 1: Enviar por E-mail */}
              <Button
                onClick={handleSendEmail}
                disabled={!clientEmail}
                className="w-full h-16 sm:h-20 text-lg sm:text-xl bg-gradient-to-r from-urbana-gold to-urbana-gold-dark hover:from-urbana-gold-light hover:to-urbana-gold text-urbana-black font-bold rounded-xl shadow-lg shadow-urbana-gold/30 transition-all duration-200 active:scale-[0.98]"
              >
                <Mail className="w-6 h-6 sm:w-7 sm:h-7 mr-3" />
                <div className="text-left">
                  <div>Enviar por E-mail</div>
                  {clientEmail ? (
                    <div className="text-xs opacity-70">{clientEmail}</div>
                  ) : (
                    <div className="text-xs opacity-70">E-mail não cadastrado</div>
                  )}
                </div>
              </Button>

              {/* Opção 2: Enviar + Imprimir (quando disponível) */}
              {isPrintAvailable && (
                <Button
                  onClick={handleSendAndPrint}
                  disabled={!clientEmail}
                  className="w-full h-16 sm:h-20 text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2 mr-3">
                    <Mail className="w-5 h-5" />
                    <span className="text-xs">+</span>
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div>Enviar e Imprimir</div>
                    <div className="text-xs opacity-70">Comprovante físico + E-mail</div>
                  </div>
                </Button>
              )}

              {/* Botão futuro - Só Imprimir (aparece desabilitado como preview) */}
              {!isPrintAvailable && (
                <Button
                  disabled
                  className="w-full h-14 text-base bg-gray-800/50 text-gray-500 font-medium rounded-xl border border-gray-700/50 cursor-not-allowed"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div>Imprimir Comprovante</div>
                    <div className="text-xs">Em breve</div>
                  </div>
                </Button>
              )}

              {/* Pular (só se não tem e-mail) */}
              {!clientEmail && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  className="w-full h-12 text-urbana-light/60 hover:text-urbana-light"
                >
                  Continuar sem comprovante
                </Button>
              )}
            </>
          )}

          {/* Estado: Enviando */}
          {status === 'sending' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-urbana-gold blur-2xl opacity-30 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center">
                  <Send className="w-10 h-10 text-urbana-black animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-urbana-light">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-lg">Enviando comprovante...</span>
              </div>
            </div>
          )}

          {/* Estado: Imprimindo */}
          {status === 'printing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Printer className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-urbana-light">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-lg">Imprimindo...</span>
              </div>
            </div>
          )}

          {/* Estado: Sucesso */}
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl">
                  <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xl font-bold text-green-400">
                  {emailSent && printed ? 'Enviado e Impresso!' : emailSent ? 'E-mail Enviado!' : 'Sucesso!'}
                </p>
                <p className="text-urbana-light/60 text-sm">Finalizando...</p>
              </div>
            </div>
          )}

          {/* Estado: Erro */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <p className="text-red-400 text-lg">Ocorreu um erro</p>
              <Button
                onClick={() => setStatus('idle')}
                variant="outline"
                className="border-urbana-gold/50 text-urbana-gold"
              >
                Tentar novamente
              </Button>
              <Button
                onClick={onComplete}
                variant="ghost"
                className="text-urbana-light/60"
              >
                Continuar sem comprovante
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TotemReceiptOptionsModal;
