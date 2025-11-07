import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TotemProductPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client } = location.state || {};

  useEffect(() => {
    if (!sale || !client) {
      navigate('/totem/home');
    }

    const timer = setTimeout(() => {
      navigate('/totem/home');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black flex items-center justify-center p-4 font-poppins">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center animate-scale-in">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400 to-green-500 blur-3xl opacity-50" />
            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <CheckCircle className="w-20 h-20 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
            Compra Finalizada!
          </h1>
          
          <p className="text-2xl text-urbana-light">
            Obrigado, {client?.nome?.split(' ')[0]}!
          </p>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-urbana-gold/20 border-2 border-urbana-gold/50 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-urbana-gold" />
            <span className="text-xl font-bold text-urbana-gold">
              R$ {sale?.total?.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={() => navigate('/totem/home')}
          size="lg"
          className="bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold text-lg px-8"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default TotemProductPaymentSuccess;
