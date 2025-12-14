import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, DollarSign, Package, Loader2, User, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from '@/types/product';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, cart, barber } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    console.log('🛒 Checkout de Produto - State recebido:', { client, cart, barber });
    
    if (!client || !cart || cart.length === 0) {
      toast.error('Carrinho vazio ou cliente não identificado');
      navigate('/totem/home');
      return;
    }

    if (!barber) {
      console.warn('⚠️ Barbeiro não selecionado, redirecionando...');
      toast.error('Selecione um barbeiro');
      navigate('/totem/product-barber-select', { state: { client, cart } });
      return;
    }

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, cart, barber, navigate]);

  const cartTotal = (cart as CartItem[]).reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);

  const handlePayment = async (paymentMethod: 'pix' | 'card') => {
    setIsProcessing(true);

    try {
      console.log('🛒 Criando venda de produtos usando tabela vendas (unificada)');
      
      // 🔒 CORREÇÃO: Criar venda com barbeiro_id
      const { data: sale, error: saleError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: client.id,
          barbeiro_id: barber.staff_id, // ✅ Incluir barbeiro
          subtotal: cartTotal,
          total: cartTotal,
          desconto: 0,
          status: 'ABERTA'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda usando vendas_itens
      const saleItems = (cart as CartItem[]).map(item => ({
        venda_id: sale.id,
        tipo: 'PRODUTO',
        ref_id: item.product.id,
        nome: item.product.nome,
        quantidade: item.quantity,
        preco_unit: item.product.preco,
        total: item.product.preco * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('vendas_itens')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      console.log('✅ Venda criada com barbeiro:', sale.id, barber.staff_id);

      if (paymentMethod === 'pix') {
        navigate('/totem/product-payment-pix', {
          state: { sale, client, cart, barber }
        });
      } else {
        navigate('/totem/product-card-type', {
          state: { sale, client, cart, barber }
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-2 sm:p-3 md:p-4 font-poppins overflow-hidden">
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
      <div className="flex items-center justify-between mb-2 sm:mb-3 z-10">
        <Button
          onClick={() => navigate('/totem/products', { 
            state: { client, cart, barber } 
          })}
          variant="ghost"
          size="sm"
          className="h-9 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
          Checkout de Produtos
        </h1>
        
        <div className="w-10 sm:w-16 md:w-24"></div>
      </div>

      {/* Content - Grid layout */}
      <div className="flex-1 overflow-hidden z-10 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
        {/* Left Column - Barber Info */}
        {barber && (
          <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 flex-shrink-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light mb-2 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
              Barbeiro
            </h2>
            
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-urbana-gold/10 backdrop-blur-sm rounded-lg border border-urbana-gold/30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-urbana-gold flex-shrink-0">
                {barber.image_url ? (
                  <img 
                    src={barber.image_url} 
                    alt={barber.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-urbana-gold/20">
                    <User className="w-5 h-5 text-urbana-gold" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-urbana-light truncate">{barber.nome}</p>
                {barber.especialidade && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Award className="w-3 h-3 text-urbana-gold flex-shrink-0" />
                    <p className="text-[10px] sm:text-xs text-urbana-light/70 truncate">{barber.especialidade}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Center Column - Order Summary */}
        <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 overflow-hidden flex flex-col">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
            Resumo do Pedido
          </h2>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {(cart as CartItem[]).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 backdrop-blur-md rounded-lg border border-urbana-gold/20">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-urbana-light truncate">{item.product.nome}</p>
                  <p className="text-[10px] sm:text-xs text-urbana-light/60">
                    {item.quantity}x R$ {item.product.preco.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm sm:text-base font-bold text-urbana-gold whitespace-nowrap ml-2">
                  R$ {(item.product.preco * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t-2 border-urbana-gold/30">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/20 to-urbana-gold/20 rounded-xl border-2 border-urbana-gold shadow-xl shadow-urbana-gold/30">
              <p className="text-sm sm:text-base font-black text-urbana-light">TOTAL:</p>
              <p className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
                R$ {cartTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column - Payment Methods */}
        <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light mb-2 sm:mb-3 text-center">
            Forma de Pagamento
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* PIX Button */}
            <button
              onClick={() => handlePayment('pix')}
              disabled={isProcessing}
              className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">PIX</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Instantâneo</span>
              </div>
            </button>

            {/* Card Button */}
            <button
              onClick={() => handlePayment('card')}
              disabled={isProcessing}
              className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">CARTÃO</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Débito/Crédito</span>
              </div>
            </button>
          </div>

          {isProcessing && (
            <div className="mt-3 flex items-center justify-center gap-2 text-urbana-gold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemProductCheckout;
