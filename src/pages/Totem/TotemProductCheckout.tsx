import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Smartphone, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from '@/types/product';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, cart } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !cart || cart.length === 0) {
      navigate('/totem/home');
      return;
    }

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const cartTotal = (cart as CartItem[]).reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);

  const handlePayment = async (paymentMethod: 'pix' | 'credit' | 'debit') => {
    setIsProcessing(true);

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('totem_product_sales')
        .insert({
          cliente_id: client.id,
          total: cartTotal,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'pix' ? 'pending' : 'completed',
          ...(paymentMethod === 'pix' && {
            pix_key: '31996857008',
            transaction_id: `PROD${Date.now()}`
          }),
          ...(paymentMethod !== 'pix' && {
            paid_at: new Date().toISOString()
          })
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = (cart as CartItem[]).map(item => ({
        sale_id: sale.id,
        produto_id: item.product.id,
        quantidade: item.quantity,
        preco_unitario: item.product.preco,
        subtotal: item.product.preco * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('totem_product_sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Navigate to payment screen
      if (paymentMethod === 'pix') {
        navigate('/totem/product-payment-pix', {
          state: { sale, client, cart }
        });
      } else {
        navigate('/totem/product-payment-card', {
          state: { sale, client, cart, paymentMethod }
        });
      }

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 z-10">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
          Checkout
        </h1>
        
        <div className="w-16 sm:w-24"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto z-10 space-y-4">
        {/* Order Summary */}
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30">
          <h2 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-urbana-gold" />
            Resumo do Pedido
          </h2>

          <div className="space-y-3">
            {(cart as CartItem[]).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-urbana-black/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-bold text-urbana-light">{item.product.nome}</p>
                  <p className="text-sm text-urbana-light/60">
                    {item.quantity}x R$ {item.product.preco.toFixed(2)}
                  </p>
                </div>
                <p className="text-lg font-bold text-urbana-gold">
                  R$ {(item.product.preco * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

            <div className="pt-4 border-t-2 border-urbana-gold/30">
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-urbana-light">Total</p>
                <p className="text-3xl font-black text-urbana-gold">
                  R$ {cartTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30">
          <h2 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4">
            Escolha a forma de pagamento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => handlePayment('pix')}
              disabled={isProcessing}
              className="h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-teal-500/20 to-teal-600/20 border-2 border-teal-500/40 active:border-teal-500 text-teal-300 active:text-teal-100 transition-all duration-100 active:scale-95 rounded-xl shadow-lg shadow-teal-500/10"
            >
              <Smartphone className="w-12 h-12" />
              <span className="text-lg font-bold">PIX</span>
            </Button>

            <Button
              onClick={() => handlePayment('credit')}
              disabled={isProcessing}
              className="h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/40 active:border-blue-500 text-blue-300 active:text-blue-100 transition-all duration-100 active:scale-95 rounded-xl shadow-lg shadow-blue-500/10"
            >
              <CreditCard className="w-12 h-12" />
              <span className="text-lg font-bold">Crédito</span>
            </Button>

            <Button
              onClick={() => handlePayment('debit')}
              disabled={isProcessing}
              className="h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/40 active:border-purple-500 text-purple-300 active:text-purple-100 transition-all duration-100 active:scale-95 rounded-xl shadow-lg shadow-purple-500/10"
            >
              <CreditCard className="w-12 h-12" />
              <span className="text-lg font-bold">Débito</span>
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-6 flex items-center justify-center gap-3 text-urbana-gold">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Processando...</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemProductCheckout;
