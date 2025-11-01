import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfflineIndicator } from '@/components/totem/OfflineIndicator';

interface ServiceItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment } = location.state || {};
  
  const [vendaId, setVendaId] = useState<string | null>(null);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!appointment) {
      navigate('/totem');
      return;
    }
    
    startCheckout();
  }, [appointment]);

  const startCheckout = async () => {
    try {
      setLoading(true);

      // Chamar edge function para iniciar checkout
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          agendamento_id: appointment.id,
          action: 'start',
          extras: [] // Pode adicionar serviços extras aqui
        }
      });

      if (error) throw error;

      if (data.success) {
        setVendaId(data.venda_id);
        setSessionId(data.session_id);
        setResumo(data.resumo);
      } else {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }
    } catch (error: any) {
      console.error('Erro ao carregar checkout:', error);
      toast.error(error.message || 'Erro ao carregar checkout');
      navigate('/totem');
    } finally {
      setLoading(false);
    }
  };

  const [sessionId, setSessionId] = useState<string | null>(null);

  const handlePaymentMethod = (method: 'pix' | 'card') => {
    if (!vendaId || !sessionId || !resumo) return;
    
    if (method === 'pix') {
      navigate('/totem/payment-pix', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment,
          total: resumo.total
        }
      });
    } else {
      navigate('/totem/payment-card', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment,
          total: resumo.total
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <OfflineIndicator />
        <p className="text-4xl text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-6 md:p-8">
      <OfflineIndicator />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
        <Button
          onClick={() => navigate('/totem')}
          variant="outline"
          size="lg"
          className="h-16 sm:h-18 md:h-20 px-4 sm:px-6 md:px-8 text-xl sm:text-xl md:text-2xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 md:mr-4" />
          Voltar
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-center flex-1">Finalizar Atendimento</h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-7 md:space-y-8 bg-card">
          {/* Services Summary */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mb-6">Resumo do Atendimento</h2>
            
            <div className="space-y-3">
              {resumo?.itens.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-2xl text-foreground">{item.nome}</span>
                  <span className="text-2xl font-semibold text-urbana-gold">
                    R$ {Number(item.preco_unit).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-semibold text-foreground">
                  R$ {Number(resumo?.subtotal || 0).toFixed(2)}
                </span>
              </div>
              
              {resumo?.desconto > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-2xl text-muted-foreground">Desconto</span>
                  <span className="text-2xl font-semibold text-green-500">
                    - R$ {Number(resumo.desconto).toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t-2 border-urbana-gold">
                <span className="text-4xl font-bold text-foreground">TOTAL</span>
                <span className="text-4xl font-bold text-urbana-gold">
                  R$ {Number(resumo?.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-8 space-y-4">
            <h3 className="text-3xl font-bold text-foreground mb-4">Escolha a forma de pagamento</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <Button
                onClick={() => handlePaymentMethod('pix')}
                disabled={processing}
                className="h-32 text-3xl font-bold bg-primary hover:bg-primary/90"
              >
                <QrCode className="w-12 h-12 mr-4" />
                PIX
              </Button>

              <Button
                onClick={() => handlePaymentMethod('card')}
                disabled={processing}
                className="h-32 text-3xl font-bold bg-primary hover:bg-primary/90"
              >
                <CreditCard className="w-12 h-12 mr-4" />
                CARTÃO
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemCheckout;
