import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tefDriver, TEFPaymentRequest, TEFPaymentResponse } from '@/lib/tef/tefDriver';
import { toast } from 'sonner';

export const useTEF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<TEFPaymentResponse | null>(null);

  // Escutar mudanças de status em tempo real
  useEffect(() => {
    if (!currentPayment?.paymentId) return;

    const channel = supabase
      .channel(`tef-payment-${currentPayment.paymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tef_mock_transactions',
          filter: `payment_id=eq.${currentPayment.paymentId}`
        },
        (payload: any) => {
          console.log('Status TEF atualizado:', payload);
          
          const newStatus = payload.new.status;
          
          setCurrentPayment(prev => prev ? {
            ...prev,
            status: newStatus,
            authorizationCode: payload.new.authorization_code,
            nsu: payload.new.nsu,
            cardBrand: payload.new.card_brand
          } : null);

          // Mostrar notificação
          if (newStatus === 'approved') {
            toast.success('Pagamento aprovado!');
            setIsProcessing(false);
          } else if (newStatus === 'declined') {
            toast.error('Pagamento recusado');
            setIsProcessing(false);
          } else if (newStatus === 'expired') {
            toast.warning('Pagamento expirado');
            setIsProcessing(false);
          } else if (newStatus === 'canceled') {
            toast.info('Pagamento cancelado');
            setIsProcessing(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPayment?.paymentId]);

  const startPayment = async (request: Omit<TEFPaymentRequest, 'terminalId'>) => {
    try {
      setIsProcessing(true);
      
      // Criar pagamento
      const payment = await tefDriver.createPayment({
        ...request,
        terminalId: '', // Será preenchido pelo driver com as configurações
        callbackUrl: `${window.location.origin}/api/tef/callback`,
        softDescriptor: request.softDescriptor || 'COSTA URBANA'
      });

      setCurrentPayment(payment);
      
      toast.info('Pagamento iniciado. Aguarde a confirmação...');
      
      return payment;
    } catch (error) {
      console.error('Erro ao iniciar pagamento:', error);
      toast.error('Erro ao iniciar pagamento');
      setIsProcessing(false);
      throw error;
    }
  };

  const cancelPayment = async () => {
    if (!currentPayment?.paymentId) {
      toast.error('Nenhum pagamento ativo');
      return;
    }

    try {
      await tefDriver.cancelPayment(currentPayment.paymentId);
      toast.info('Pagamento cancelado');
      setCurrentPayment(null);
      setIsProcessing(false);
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      toast.error('Erro ao cancelar pagamento');
      throw error;
    }
  };

  const checkPaymentStatus = async (paymentId?: string) => {
    const id = paymentId || currentPayment?.paymentId;
    
    if (!id) {
      toast.error('ID de pagamento não encontrado');
      return null;
    }

    try {
      const status = await tefDriver.getPaymentStatus(id);
      
      if (!paymentId && currentPayment) {
        setCurrentPayment(status);
      }
      
      return status;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status do pagamento');
      throw error;
    }
  };

  const resetPayment = () => {
    setCurrentPayment(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    currentPayment,
    startPayment,
    cancelPayment,
    checkPaymentStatus,
    resetPayment
  };
};