import React, { useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { format } from 'date-fns';
import TotemTEFPaymentScreen, { TransactionData } from '@/components/totem/TotemTEFPaymentScreen';

const TotemPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], extraServices = [], resumo, isDirect = false, tipAmount = 0 } = location.state || {};

  const paymentTypeRef = useRef<'credit' | 'debit'>('credit');

  // Callback para envio de e-mail de comprovante
  const handleSendReceiptEmail = useCallback(async (transactionData: TransactionData, paymentType: 'credit' | 'debit'): Promise<boolean> => {
    if (!client?.email) return false;

    try {
      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      // Serviço principal
      if (resumo?.original_service) {
        items.push({ name: resumo.original_service.nome, quantity: 1, unitPrice: resumo.original_service.preco, price: resumo.original_service.preco, type: 'service' });
      } else if (appointment?.servico) {
        const p = appointment.servico.preco || 0;
        items.push({ name: appointment.servico.nome, quantity: 1, unitPrice: p, price: p, type: 'service' });
      }

      // Serviços extras
      if (resumo?.extra_services) {
        resumo.extra_services.forEach((service: { nome: string; preco: number }) => {
          items.push({ name: service.nome, quantity: 1, unitPrice: service.preco, price: service.preco, type: 'service' });
        });
      } else if (extraServices?.length > 0) {
        extraServices.forEach((service: { nome: string; preco: number }) => {
          items.push({ name: service.nome, quantity: 1, unitPrice: service.preco, price: service.preco, type: 'service' });
        });
      }

      // Produtos
      if (selectedProducts?.length > 0) {
        selectedProducts.forEach((product: { nome: string; preco: number; quantidade: number }) => {
          items.push({ name: product.nome, quantity: product.quantidade, unitPrice: product.preco, price: product.preco * product.quantidade, type: 'product' });
        });
      }

      if (items.length === 0) {
        items.push({ name: 'Serviço', price: total, type: 'service' });
      }

      const hasServices = items.some(item => item.type === 'service');
      const hasProducts = items.some(item => item.type === 'product');
      let transactionType: 'service' | 'product' | 'mixed' = 'service';
      if (hasServices && hasProducts) transactionType = 'mixed';
      else if (hasProducts) transactionType = 'product';

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType,
        items,
        total,
        paymentMethod: paymentType === 'credit' ? 'Crédito' : 'Débito',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: transactionData?.nsu,
        barberName: appointment?.barbeiro?.nome,
        tipAmount: Number(tipAmount || 0),
      });

      return result.success;
    } catch (error) {
      console.error('[CARD] Erro ao enviar e-mail:', error);
      return false;
    }
  }, [client, resumo, appointment, extraServices, selectedProducts, total, tipAmount]);

  // Callback de finalização - chamado após comprovante processado
  const handleFinalize = useCallback(async (transactionData: TransactionData, paymentType: 'credit' | 'debit') => {
    paymentTypeRef.current = paymentType;

    console.log('✅ [CARD] COMPROVANTE PROCESSADO - FINALIZANDO');

    try {
      if (isDirect) {
        await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            transaction_data: transactionData,
          }
        });
      } else {
        await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            agendamento_id: appointment?.id,
            session_id: session_id,
            transaction_data: transactionData,
            payment_method: paymentType === 'debit' ? 'DEBITO' : 'CREDITO',
            tipAmount: tipAmount,
            extras: (extraServices || []).map((s: any) => ({ id: s.id })),
            products: (selectedProducts || []).map((p: any) => ({ id: p.id || p.product_id, quantidade: p.quantidade })),
          }
        });
      }

      // Atualizar estoque dos produtos
      if (selectedProducts?.length > 0) {
        for (const product of selectedProducts) {
          const { data: currentProduct } = await supabase
            .from('painel_produtos')
            .select('estoque')
            .eq('id', product.product_id)
            .single();

          if (currentProduct) {
            await supabase
              .from('painel_produtos')
              .update({ estoque: Math.max(0, currentProduct.estoque - product.quantidade) })
              .eq('id', product.product_id);
          }
        }
      }

      console.log('✅ [CARD] Checkout finalizado com sucesso!');

      navigate('/totem/payment-success', {
        state: {
          appointment,
          client,
          total,
          paymentMethod: paymentType,
          isDirect,
          transactionData,
          selectedProducts,
          extraServices,
          resumo,
          emailAlreadySent: true,
          tipAmount,
        }
      });
    } catch (error) {
      console.error('❌ [CARD] Erro ao finalizar:', error);
      toast.error('Erro ao finalizar checkout', {
        description: 'O pagamento foi aprovado. Procure a recepção.'
      });
      navigate('/totem/home');
    }
  }, [venda_id, session_id, isDirect, selectedProducts, appointment, client, total, navigate, extraServices, resumo, tipAmount]);

  const handleBack = useCallback(() => {
    navigate('/totem/checkout', { state: location.state });
  }, [navigate, location.state]);

  if (!venda_id || !total) return null;

  return (
    <TotemTEFPaymentScreen
      total={total}
      vendaId={venda_id}
      clientName={client?.nome || ''}
      clientEmail={client?.email}
      logPrefix="checkout_servico"
      logLabel="[SERVIÇO]"
      onBack={handleBack}
      onFinalize={handleFinalize}
      onSendReceiptEmail={handleSendReceiptEmail}
    />
  );
};

export default TotemPaymentCard;
