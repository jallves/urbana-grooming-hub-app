import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { format } from 'date-fns';
import TotemTEFPaymentScreen, { TransactionData } from '@/components/totem/TotemTEFPaymentScreen';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale: saleFromState, client, barber, cart } = location.state || {};

  const sale = saleFromState ? {
    ...saleFromState,
    total: saleFromState.total || saleFromState.valor_total || 0,
  } : null;

  // Callback para envio de e-mail de comprovante
  const handleSendReceiptEmail = useCallback(async (transactionData: TransactionData, paymentType: 'credit' | 'debit'): Promise<boolean> => {
    if (!client?.email) return false;

    try {
      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      if (cart && cart.length > 0) {
        cart.forEach((item: any) => {
          const product = item.product || item;
          const qty = item.quantity || item.quantidade || 1;
          const price = product.preco || item.preco || 0;
          items.push({
            name: product.nome || item.nome,
            quantity: qty,
            unitPrice: price,
            price: price * qty,
            type: 'product',
          });
        });
      }

      if (items.length === 0) {
        items.push({ name: 'Produto', price: sale?.total || 0, type: 'product' });
      }

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType: 'product',
        items,
        total: sale?.total || 0,
        paymentMethod: paymentType === 'credit' ? 'Crédito' : 'Débito',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: transactionData?.nsu,
        barberName: barber?.nome,
        tipAmount: 0,
      });

      return result.success;
    } catch (error) {
      console.error('[PRODUCT-CARD] Erro ao enviar e-mail:', error);
      return false;
    }
  }, [client, cart, sale, barber]);

  // Callback de finalização
  const handleFinalize = useCallback(async (transactionData: TransactionData, paymentType: 'credit' | 'debit') => {
    console.log('✅ [PRODUCT-CARD] COMPROVANTE PROCESSADO - FINALIZANDO');

    try {
      const paymentMethod = paymentType === 'debit' ? 'DEBITO' : 'CREDITO';

      const { error: finishError } = await supabase.functions.invoke('totem-direct-sale', {
        body: {
          action: 'finish',
          venda_id: sale?.id,
          payment_method: paymentMethod,
          transaction_data: transactionData,
        }
      });

      if (finishError) {
        console.error('❌ [PRODUCT-CARD] Erro ao finalizar:', finishError);
      } else {
        console.log('✅ [PRODUCT-CARD] Edge function executada com sucesso');
      }

      // Buscar itens da venda
      let saleItems: any[] = [];
      try {
        const { data: fetchedItems } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', sale?.id)
          .eq('tipo', 'PRODUTO');
        saleItems = fetchedItems || [];
      } catch (e) {
        console.warn('[PRODUCT-CARD] Erro ao buscar itens:', e);
        if (cart && cart.length > 0) {
          saleItems = cart.map((item: any) => ({
            item_id: item.product?.id || item.id,
            nome: item.product?.nome || item.nome,
            quantidade: item.quantity || 1,
            preco_unitario: item.product?.preco || item.preco,
            subtotal: (item.product?.preco || item.preco) * (item.quantity || 1),
          }));
        }
      }

      console.log('✅ [PRODUCT-CARD] Checkout finalizado com sucesso!');

      navigate('/totem/product-payment-success', {
        state: {
          sale: { ...sale, items: saleItems, total: sale?.total },
          client,
          transactionData: { ...transactionData, paymentMethod: paymentType },
          emailAlreadySent: true,
        }
      });
    } catch (err) {
      console.error('❌ [PRODUCT-CARD] Erro crítico:', err);

      if (transactionData?.nsu || transactionData?.autorizacao) {
        toast.warning('Pagamento aprovado com observações');
        navigate('/totem/product-payment-success', {
          state: {
            sale: { ...sale, items: [], total: sale?.total },
            client,
            transactionData: { ...transactionData, paymentMethod: paymentType },
            emailAlreadySent: true,
          }
        });
      } else {
        toast.error('Erro ao finalizar checkout', {
          description: 'O pagamento foi aprovado. Procure a recepção.',
        });
        navigate('/totem/home');
      }
    }
  }, [sale, client, cart, navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (!sale) return null;

  return (
    <TotemTEFPaymentScreen
      total={sale.total}
      vendaId={sale.id}
      clientName={client?.nome || ''}
      clientEmail={client?.email}
      logPrefix="checkout_produto"
      logLabel="[PRODUTO]"
      onBack={handleBack}
      onFinalize={handleFinalize}
      onSendReceiptEmail={handleSendReceiptEmail}
    />
  );
};

export default TotemProductPaymentCard;
