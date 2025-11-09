import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductCardType: React.FC = () => {
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

  const cartTotal = cart.reduce((sum: number, item: any) => sum + (item.product.preco * item.quantity), 0);

  const handleCardTypeSelect = async (cardType: 'debit' | 'credit') => {
    setIsProcessing(true);

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('totem_product_sales')
        .insert({
          cliente_id: client.id,
          total: cartTotal,
          payment_method: cardType === 'debit' ? 'debit_card' : 'credit_card',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item: any) => ({
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
      navigate('/totem/product-payment-card', {
        state: { sale, client, cart, cardType }
      });

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
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
          Tipo de Cartão
        </h1>
        
        <div className="w-16 sm:w-24"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="w-full max-w-2xl p-6 sm:p-8 bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
          <h2 className="text-2xl sm:text-3xl font-bold text-urbana-light mb-2 text-center">
            Selecione o Tipo de Cartão
          </h2>
          
          <p className="text-xl sm:text-2xl font-black text-urbana-gold mb-8 text-center">
            Total: R$ {cartTotal.toFixed(2)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Débito Button */}
            <button
              onClick={() => handleCardTypeSelect('debit')}
              disabled={isProcessing}
              className="group relative h-48 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                  <CreditCard className="w-12 h-12 text-urbana-gold" />
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-black text-urbana-gold mb-2">DÉBITO</span>
                  <span className="text-sm text-urbana-gray-light">Pagamento à vista</span>
                </div>
              </div>
            </button>

            {/* Crédito Button */}
            <button
              onClick={() => handleCardTypeSelect('credit')}
              disabled={isProcessing}
              className="group relative h-48 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                  <CreditCard className="w-12 h-12 text-urbana-gold" />
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-black text-urbana-gold mb-2">CRÉDITO</span>
                  <span className="text-sm text-urbana-gray-light">À vista ou parcelado</span>
                </div>
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

export default TotemProductCardType;
