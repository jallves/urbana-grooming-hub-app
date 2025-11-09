import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, DollarSign, Package, Loader2 } from 'lucide-react';
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
      toast.error('Carrinho vazio ou cliente não identificado');
      navigate('/totem/home');
      return;
    }

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, cart, navigate]);

  const cartTotal = (cart as CartItem[]).reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);

  const handlePayment = async (paymentMethod: 'pix' | 'card') => {
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
          state: { sale, client, cart, paymentMethod: 'card' }
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
        <Card className="p-4 sm:p-6 bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
          <h2 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-urbana-gold" />
            Resumo do Pedido
          </h2>

          <div className="space-y-3">
            {(cart as CartItem[]).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-md rounded-lg border border-urbana-gold/20">
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
        <Card className="p-4 sm:p-6 bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
          <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 text-center">
            Forma de Pagamento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PIX Button */}
            <button
              onClick={() => handlePayment('pix')}
              disabled={isProcessing}
              className="group relative h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                  <DollarSign className="w-10 h-10 text-urbana-gold" />
                </div>
                <span className="text-3xl font-black text-urbana-gold">PIX</span>
                <span className="text-sm text-urbana-gray-light">Instantâneo</span>
              </div>
            </button>

            {/* Card Button */}
            <button
              onClick={() => handlePayment('card')}
              disabled={isProcessing}
              className="group relative h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                  <CreditCard className="w-10 h-10 text-urbana-gold" />
                </div>
                <span className="text-3xl font-black text-urbana-gold">CARTÃO</span>
                <span className="text-sm text-urbana-gray-light">Crédito/Débito</span>
              </div>
            </button>
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
