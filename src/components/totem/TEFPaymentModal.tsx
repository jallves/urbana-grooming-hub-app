import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTEF } from '@/hooks/useTEF';

interface TEFPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix';
  installments?: number;
  reference?: string;
  onSuccess?: (paymentId: string, authCode: string) => void;
  onError?: (error: string) => void;
}

const TEFPaymentModal: React.FC<TEFPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  paymentType,
  installments = 1,
  reference,
  onSuccess,
  onError
}) => {
  const { isProcessing, currentPayment, startPayment, cancelPayment, resetPayment } = useTEF();

  useEffect(() => {
    if (isOpen && !currentPayment) {
      initiatePayment();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentPayment?.status === 'approved' && currentPayment.authorizationCode) {
      onSuccess?.(currentPayment.paymentId, currentPayment.authorizationCode);
    } else if (currentPayment?.status === 'declined') {
      onError?.('Pagamento recusado');
    } else if (currentPayment?.status === 'expired') {
      onError?.('Pagamento expirado');
    } else if (currentPayment?.status === 'canceled') {
      onError?.('Pagamento cancelado');
    }
  }, [currentPayment?.status]);

  const initiatePayment = async () => {
    try {
      await startPayment({
        amount,
        paymentType,
        installments,
        reference: reference || `totem_${Date.now()}`
      });
    } catch (error) {
      onError?.('Erro ao iniciar pagamento');
    }
  };

  const handleCancel = async () => {
    await cancelPayment();
    resetPayment();
    onClose();
  };

  const handleClose = () => {
    if (currentPayment?.status !== 'processing') {
      resetPayment();
      onClose();
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusIcon = () => {
    switch (currentPayment?.status) {
      case 'processing':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'declined':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-16 w-16 text-orange-500" />;
      case 'canceled':
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (currentPayment?.status) {
      case 'processing':
        return 'Aguardando pagamento na maquininha...';
      case 'approved':
        return 'Pagamento aprovado com sucesso!';
      case 'declined':
        return 'Pagamento recusado. Tente novamente.';
      case 'expired':
        return 'Tempo limite excedido.';
      case 'canceled':
        return 'Pagamento cancelado.';
      default:
        return 'Iniciando pagamento...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento {paymentType === 'pix' ? 'PIX' : paymentType === 'credit' ? 'Crédito' : 'Débito'}
          </DialogTitle>
          <DialogDescription>
            {formatAmount(amount)}
            {installments > 1 && ` em ${installments}x`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {getStatusIcon()}
          
          <p className="text-center text-lg font-medium">
            {getStatusMessage()}
          </p>

          {currentPayment?.paymentId && (
            <p className="text-sm text-gray-500 font-mono">
              ID: {currentPayment.paymentId}
            </p>
          )}

          {currentPayment?.authorizationCode && (
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">Código de Autorização</p>
              <p className="text-lg font-mono font-bold">
                {currentPayment.authorizationCode}
              </p>
            </div>
          )}

          {currentPayment?.status === 'processing' && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Processando pagamento...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {currentPayment?.status === 'processing' && (
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          
          {currentPayment?.status && currentPayment.status !== 'processing' && (
            <Button
              onClick={handleClose}
              className="flex-1 bg-black hover:bg-gray-800"
            >
              {currentPayment.status === 'approved' ? 'Continuar' : 'Fechar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TEFPaymentModal;