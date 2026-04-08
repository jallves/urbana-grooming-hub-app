import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Banknote, CheckCircle2, Delete } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { format } from 'date-fns';
import TotemReceiptOptionsModal from '@/components/totem/TotemReceiptOptionsModal';
import barbershopBg from '@/assets/barbershop-background.jpg';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const QUICK_VALUES = [5, 10, 20, 50, 100, 200];

const TotemProductPaymentCash: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale: saleFromState, client, barber, cart, subscriptionPlan } = location.state || {};

  const sale = saleFromState ? {
    ...saleFromState,
    total: saleFromState.total || saleFromState.valor_total || 0,
  } : null;

  const total = sale?.total || 0;

  const [amountPaidCents, setAmountPaidCents] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const finalizingRef = useRef(false);

  const amountPaid = amountPaidCents / 100;
  const change = Math.max(0, amountPaid - total);
  const isEnough = amountPaid >= total;

  const handleDigit = (digit: number) => {
    setAmountPaidCents(prev => {
      const next = prev * 10 + digit;
      return next > 9999999 ? prev : next;
    });
  };

  const handleBackspace = () => setAmountPaidCents(prev => Math.floor(prev / 10));
  const handleClear = () => setAmountPaidCents(0);
  const handleQuickAdd = (value: number) => setAmountPaidCents(prev => prev + value * 100);
  const handleExactAmount = () => setAmountPaidCents(Math.ceil(total * 100));

  const handleSendReceiptEmail = useCallback(async (): Promise<boolean> => {
    if (!client?.email) return false;
    try {
      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      if (cart?.length > 0) {
        cart.forEach((item: any) => {
          const product = item.product || item;
          const qty = item.quantity || item.quantidade || 1;
          const price = product.preco || item.preco || 0;
          items.push({ name: product.nome || item.nome, quantity: qty, unitPrice: price, price: price * qty, type: 'product' });
        });
      }
      if (items.length === 0) items.push({ name: 'Produto', price: total, type: 'product' });

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType: 'product',
        items,
        total,
        paymentMethod: 'Dinheiro',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        barberName: barber?.nome,
        tipAmount: 0,
      });
      return result.success;
    } catch (e) {
      console.error('[PRODUCT-CASH] Erro ao enviar e-mail:', e);
      return false;
    }
  }, [client, cart, total, barber]);

  const handleReceiptComplete = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;

    console.log('✅ [PRODUCT-CASH] FINALIZANDO');

    const localItems = cart?.length > 0
      ? cart.map((item: any) => ({
          item_id: item.product?.id || item.id,
          nome: item.product?.nome || item.nome,
          quantidade: item.quantity || 1,
          preco_unitario: item.product?.preco || item.preco,
          subtotal: (item.product?.preco || item.preco) * (item.quantity || 1),
        }))
      : [];

    navigate('/totem/product-payment-success', {
      state: {
        sale: { ...sale, items: localItems, total },
        client,
        transactionData: { paymentMethod: 'cash' },
        emailAlreadySent: true,
        cashPaymentDetails: { amountPaid, change },
      },
    });

    // Finalizar em background
    try {
      await supabase.functions.invoke('totem-direct-sale', {
        body: {
          action: 'finish',
          venda_id: sale?.id,
          payment_method: 'DINHEIRO',
          transaction_data: null,
        },
      });
      console.log('✅ [PRODUCT-CASH] Finalizado em background');
    } catch (err) {
      console.error('❌ [PRODUCT-CASH] Erro background:', err);
    }
  }, [sale, client, cart, navigate, total, amountPaid, change]);

  const handleConfirmPayment = () => {
    if (!isEnough) {
      toast.error('Valor insuficiente');
      return;
    }
    setShowReceiptModal(true);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 sm:p-6 font-poppins relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/75" />
      </div>

      <div className="flex items-center justify-between mb-4 z-10">
        <Button onClick={() => navigate(-1)} variant="ghost" className="text-urbana-light hover:text-urbana-gold">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 flex items-center gap-3">
          <Banknote className="w-8 h-8 text-green-400" />
          Pagamento em Dinheiro
        </h1>
        <div className="w-24" />
      </div>

      <div className="flex-1 z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto w-full overflow-hidden">
        <Card className="p-4 sm:p-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-green-500/30 flex flex-col justify-between">
          <div className="text-center mb-4">
            <p className="text-urbana-light/60 text-sm mb-1">TOTAL A PAGAR</p>
            <p className="text-3xl sm:text-4xl font-black text-urbana-gold">R$ {formatCurrency(total)}</p>
          </div>

          <div className="text-center mb-4 p-4 bg-green-500/10 rounded-xl border-2 border-green-500/30">
            <p className="text-green-300/60 text-sm mb-1">VALOR RECEBIDO</p>
            <p className="text-4xl sm:text-5xl font-black text-green-400">R$ {formatCurrency(amountPaid)}</p>
          </div>

          <div className={`text-center p-4 rounded-xl border-2 transition-all duration-300 ${
            isEnough ? 'bg-emerald-500/15 border-emerald-400/50' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className={`text-sm mb-1 ${isEnough ? 'text-emerald-300/60' : 'text-red-300/60'}`}>
              {isEnough ? 'TROCO' : 'FALTAM'}
            </p>
            <p className={`text-3xl sm:text-4xl font-black ${isEnough ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {formatCurrency(isEnough ? change : total - amountPaid)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {QUICK_VALUES.map(val => (
              <Button
                key={val}
                onClick={() => handleQuickAdd(val)}
                variant="outline"
                className="h-12 text-lg font-bold border-green-500/40 text-green-300 hover:bg-green-500/20 hover:text-green-200 bg-green-500/5"
              >
                +R$ {val}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleExactAmount}
            variant="outline"
            className="mt-2 h-10 text-sm border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/20 bg-urbana-gold/5"
          >
            Valor Exato
          </Button>
        </Card>

        <Card className="p-4 sm:p-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-green-500/30 flex flex-col">
          <div className="flex-1 grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <Button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-14 sm:h-16 text-2xl sm:text-3xl font-bold bg-urbana-black/50 border-2 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/20 hover:border-urbana-gold/60"
              >
                {d}
              </Button>
            ))}
            <Button onClick={handleClear} className="h-14 sm:h-16 text-base font-bold bg-red-500/20 border-2 border-red-500/30 text-red-300 hover:bg-red-500/30">
              Limpar
            </Button>
            <Button onClick={() => handleDigit(0)} className="h-14 sm:h-16 text-2xl sm:text-3xl font-bold bg-urbana-black/50 border-2 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/20 hover:border-urbana-gold/60">
              0
            </Button>
            <Button onClick={handleBackspace} className="h-14 sm:h-16 text-base font-bold bg-amber-500/20 border-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/30">
              <Delete className="w-6 h-6" />
            </Button>
          </div>

          <Button
            onClick={handleConfirmPayment}
            disabled={!isEnough}
            className={`w-full h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
              isEnough
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 border-2 border-green-400/50'
                : 'bg-gray-700/50 text-gray-400 border-2 border-gray-600/30 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-7 h-7" />
            {isEnough
              ? change > 0 ? `Confirmar — Troco R$ ${formatCurrency(change)}` : 'Confirmar Pagamento'
              : 'Valor Insuficiente'
            }
          </Button>
        </Card>
      </div>

      <TotemReceiptOptionsModal
        isOpen={showReceiptModal}
        onClose={() => {}}
        onComplete={handleReceiptComplete}
        clientName={client?.nome || ''}
        clientEmail={client?.email}
        total={total}
        onSendEmail={handleSendReceiptEmail}
        isPrintAvailable={false}
      />
    </div>
  );
};

export default TotemProductPaymentCash;
