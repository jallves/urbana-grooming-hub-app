import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TotemPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, total, paymentMethod } = location.state || {};

  useEffect(() => {
    // Retorna para home após 10 segundos
    const timer = setTimeout(() => {
      navigate('/totem');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!appointment || !total) {
    navigate('/totem');
    return null;
  }

  const getPaymentMethodText = () => {
    if (paymentMethod === 'credit') return 'Cartão de Crédito';
    if (paymentMethod === 'debit') return 'Cartão de Débito';
    return 'PIX';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-4xl p-8 sm:p-12 md:p-16 space-y-8 sm:space-y-10 md:space-y-12 bg-card">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <CheckCircle className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 text-primary" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-6 text-center">
          <h1 className="text-6xl font-bold text-foreground">
            Pagamento Confirmado!
          </h1>
          <p className="text-4xl text-muted-foreground">
            Obrigado pela preferência!
          </p>
        </div>

        {/* Receipt */}
        <div className="bg-background rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-4 text-3xl font-bold text-urbana-gold border-b border-border pb-4">
            <Receipt className="w-10 h-10" />
            RECIBO DE PAGAMENTO
          </div>

          <div className="space-y-4 text-2xl">
            <div className="flex justify-between py-3 border-b border-border/50">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-semibold text-foreground">
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-border/50">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-semibold text-foreground">
                {appointment.cliente?.nome || 'Cliente'}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-border/50">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-semibold text-foreground">
                {appointment.servico?.nome}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-border/50">
              <span className="text-muted-foreground">Forma de Pagamento:</span>
              <span className="font-semibold text-foreground">
                {getPaymentMethodText()}
              </span>
            </div>

            <div className="flex justify-between py-6 border-t-4 border-urbana-gold pt-6">
              <span className="text-3xl font-bold text-foreground">TOTAL PAGO:</span>
              <span className="text-4xl font-black text-urbana-gold">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-3xl text-foreground font-semibold">
            Até a próxima! 
          </p>
          <p className="text-2xl text-urbana-gold font-bold">
            Costa Urbana Barbearia
          </p>
          <p className="text-xl text-muted-foreground animate-pulse pt-8">
            Retornando ao início em 10 segundos...
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TotemPaymentSuccess;
