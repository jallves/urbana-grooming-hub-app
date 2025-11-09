import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client, paymentMethod } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!sale || !client) {
      navigate('/totem/home');
      return;
    }
    
    // Simular processamento de cartão automaticamente
    setIsProcessing(true);
    
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('totem_product_sales')
          .update({
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', sale.id);

        if (error) throw error;
        
        toast.success('Pagamento aprovado!');
        navigate('/totem/product-payment-success', { state: { sale, client } });
      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        toast.error('Erro ao processar pagamento');
        setIsProcessing(false);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [sale, client, navigate]);

  if (!sale) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 font-poppins relative overflow-hidden">
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

      <Card className="relative w-full max-w-2xl p-8 space-y-8 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30 text-center z-10">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
            <CreditCard className="w-16 h-16 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold">
            Processando Pagamento
          </h1>
          
          <p className="text-2xl font-black text-urbana-gold">
            R$ {sale.total.toFixed(2)}
          </p>
          
          <p className="text-lg text-urbana-light/70">
            Aproxime ou insira seu cartão na máquina
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
        </div>
      </Card>
    </div>
  );
};

export default TotemProductPaymentCard;
