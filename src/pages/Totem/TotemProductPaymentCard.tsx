import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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
    
    // Auto-process card payment after 2 seconds
    const timer = setTimeout(() => {
      processPayment();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const processPayment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      toast.success('Pagamento aprovado!');
      navigate('/totem/product-payment-success', { state: { sale, client } });
    }, 3000);
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black flex items-center justify-center p-4 font-poppins">
      <Card className="w-full max-w-2xl p-8 space-y-8 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30 text-center">
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
