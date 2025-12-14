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
  const { client, cart, barber, sale } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !cart || cart.length === 0 || !barber || !sale) {
      toast.error('Dados incompletos');
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
      console.log('💳 Selecionando tipo de cartão:', cardType);

      // Navegar para tela de processamento do cartão
      navigate('/totem/product-payment-card', {
        state: { sale, client, cart, barber, cardType }
      });

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
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
          onClick={() => navigate('/totem/product-checkout', { 
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
          Pagamento com Cartão
        </h1>
        
        <div className="w-10 sm:w-16 md:w-24"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="w-full max-w-lg sm:max-w-xl md:max-w-2xl p-3 sm:p-5 md:p-6 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-[0_8px_32px_rgba(212,175,55,0.3)] rounded-2xl space-y-3 sm:space-y-4">
          
          {/* Amount Display */}
          <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 bg-gradient-to-r from-urbana-gold/10 via-urbana-gold-vibrant/10 to-urbana-gold/10 rounded-xl border-2 border-urbana-gold/30">
            <p className="text-sm sm:text-base md:text-lg text-urbana-light/70 font-medium">Valor total</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
              R$ {cartTotal.toFixed(2)}
            </p>
          </div>

          {/* Card Type Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light text-center">
              Escolha o tipo de cartão
            </h3>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Débito Button */}
              <button
                onClick={() => handleCardTypeSelect('debit')}
                disabled={isProcessing}
                className="group relative h-28 sm:h-32 md:h-36 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold block">DÉBITO</span>
                    <span className="text-[10px] sm:text-xs text-urbana-gray-light">Pagamento à vista</span>
                  </div>
                </div>
              </button>

              {/* Crédito Button */}
              <button
                onClick={() => handleCardTypeSelect('credit')}
                disabled={isProcessing}
                className="group relative h-28 sm:h-32 md:h-36 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold block">CRÉDITO</span>
                    <span className="text-[10px] sm:text-xs text-urbana-gray-light">Parcelamento disponível</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-center pt-2">
            <p className="text-sm sm:text-base md:text-lg text-urbana-gray-light">
              Após selecionar, siga as instruções na maquininha
            </p>
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

export default TotemProductCardType;
