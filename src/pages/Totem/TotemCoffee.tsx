import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Minus, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { decrementCoffeeStock } from '@/utils/coffeeStock';
import { toast } from 'sonner';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

const COFFEE_MESSAGES = [
  '☕ Boa degustação! Aproveite seu café com todo o conforto que você merece.',
  '☕ Seu café está a caminho! Relaxe e aproveite esse momento só seu.',
  '☕ Nada como um bom café para começar bem. Boa degustação!',
  '☕ Café selecionado com carinho. Aproveite cada gole!',
  '☕ Um café especial para um cliente especial. Boa degustação!',
];

const TotemCoffee: React.FC = () => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const handleIncrement = () => {
    if (quantity < 5) setQuantity(q => q + 1);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('coffee_records').insert({
        quantity,
        notes: 'Solicitação via Totem - autoatendimento',
      });

      if (error) throw error;

      // Abater estoque do café
      await decrementCoffeeStock(quantity);

      const msg = COFFEE_MESSAGES[Math.floor(Math.random() * COFFEE_MESSAGES.length)];
      setSuccessMessage(msg);
      setIsSuccess(true);

      // Auto redirect after 6 seconds
      setTimeout(() => navigate('/totem/home'), 6000);
    } catch (err) {
      console.error('Erro ao registrar café:', err);
      toast.error('Erro ao registrar café. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center relative font-poppins overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
        </div>

        <div className="relative z-10 text-center space-y-6 sm:space-y-8 px-6 max-w-lg animate-fade-in">
          {/* Animated coffee icon */}
          <div className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="text-6xl sm:text-7xl animate-bounce" style={{ animationDuration: '2s' }}>☕</div>
            </div>
            {/* Steam effect */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-1 h-6 bg-gradient-to-t from-urbana-gold/40 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="w-1 h-8 bg-gradient-to-t from-urbana-gold/30 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 h-5 bg-gradient-to-t from-urbana-gold/40 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
              Café Registrado!
            </h1>
            <p className="text-base sm:text-lg text-urbana-gold-light/90 font-light leading-relaxed">
              {successMessage}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Sparkles className="w-4 h-4 text-urbana-gold/60" />
              <p className="text-sm text-urbana-gold/60">
                {quantity} {quantity === 1 ? 'café' : 'cafés'} • Cortesia Costa Urbana
              </p>
              <Sparkles className="w-4 h-4 text-urbana-gold/60" />
            </div>
          </div>

          <Button
            onClick={() => navigate('/totem/home')}
            className="mt-4 bg-urbana-gold/20 border border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/30 px-8 py-3 rounded-xl text-base"
            style={{ touchAction: 'manipulation' }}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative font-poppins overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Back button */}
      <Button
        onClick={() => navigate('/totem/home')}
        variant="ghost"
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 gap-2 text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 hover:bg-urbana-gold/20 hover:border-urbana-gold hover:text-urbana-gold rounded-lg h-10 px-3"
        style={{ touchAction: 'manipulation' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Voltar</span>
      </Button>

      <div className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={costaUrbanaLogo} alt="Costa Urbana" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="text-5xl sm:text-6xl">☕</div>
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
            Café Cortesia
          </h1>
          <p className="text-sm sm:text-base text-urbana-gold-light/70 font-light">
            Selecione a quantidade desejada
          </p>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 py-4">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-urbana-gold/40 flex items-center justify-center text-urbana-gold active:scale-90 active:bg-urbana-gold/20 transition-all duration-200 disabled:opacity-30 disabled:active:scale-100 backdrop-blur-sm"
            style={{ touchAction: 'manipulation', background: 'rgba(0,0,0,0.2)' }}
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="relative">
            <div className="absolute -inset-4 bg-urbana-gold/10 rounded-full blur-xl" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-urbana-gold/50 flex items-center justify-center backdrop-blur-sm"
                 style={{ background: 'rgba(0,0,0,0.3)' }}>
              <span className="text-3xl sm:text-4xl font-bold text-urbana-gold">{quantity}</span>
            </div>
          </div>

          <button
            onClick={handleIncrement}
            disabled={quantity >= 5}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-urbana-gold/40 flex items-center justify-center text-urbana-gold active:scale-90 active:bg-urbana-gold/20 transition-all duration-200 disabled:opacity-30 disabled:active:scale-100 backdrop-blur-sm"
            style={{ touchAction: 'manipulation', background: 'rgba(0,0,0,0.2)' }}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-urbana-gold/50">
          Máximo 5 cafés por vez
        </p>

        {/* Confirm button */}
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-all duration-200 border-0"
          style={{ touchAction: 'manipulation' }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Registrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Coffee className="w-5 h-5" />
              Confirmar {quantity} {quantity === 1 ? 'Café' : 'Cafés'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TotemCoffee;
