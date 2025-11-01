import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServiceItem {
  nome: string;
  preco: number;
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, appointment } = location.state || {};
  
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !appointment) {
      navigate('/totem');
      return;
    }
    
    loadServices();
  }, [sessionId, appointment]);

  const loadServices = async () => {
    try {
      // Carregar serviço original
      const originalService: ServiceItem = {
        nome: appointment.servico?.nome || 'Serviço',
        preco: appointment.servico?.preco || 0
      };

      // Carregar serviços extras
      const { data: extraServices, error } = await supabase
        .from('appointment_extra_services')
        .select(`
          service_id,
          painel_servicos (
            nome,
            preco
          )
        `)
        .eq('appointment_id', appointment.id);

      if (error) throw error;

      const extraServicesList: ServiceItem[] = extraServices?.map(es => ({
        nome: (es as any).painel_servicos?.nome || 'Serviço Extra',
        preco: (es as any).painel_servicos?.preco || 0
      })) || [];

      setServices([originalService, ...extraServicesList]);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.preco, 0);
  };

  const handlePaymentMethod = (method: 'pix' | 'card') => {
    const total = calculateTotal();
    
    if (method === 'pix') {
      navigate('/totem/payment-pix', {
        state: {
          sessionId,
          appointment,
          services,
          total
        }
      });
    } else {
      navigate('/totem/payment-card', {
        state: {
          sessionId,
          appointment,
          services,
          total
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-4xl text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/totem')}
          variant="outline"
          size="lg"
          className="h-20 px-8 text-2xl"
        >
          <ArrowLeft className="w-8 h-8 mr-4" />
          Cancelar
        </Button>
        <h1 className="text-5xl font-bold text-foreground">Resumo do Atendimento</h1>
        <div className="w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-12 space-y-8 bg-card">
          {/* Services List */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground border-b border-border pb-4">
              Serviços Realizados
            </h2>
            
            {services.map((service, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-4 border-b border-border/50"
              >
                <span className="text-3xl text-foreground">{service.nome}</span>
                <span className="text-3xl font-bold text-urbana-gold">
                  R$ {service.preco.toFixed(2)}
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-6 border-t-4 border-urbana-gold">
              <span className="text-4xl font-bold text-foreground">TOTAL</span>
              <span className="text-5xl font-black text-urbana-gold">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-8 space-y-4">
            <h3 className="text-3xl font-bold text-foreground text-center mb-6">
              Escolha a forma de pagamento
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <Button
                onClick={() => handlePaymentMethod('pix')}
                variant="default"
                className="h-28 sm:h-30 md:h-32 text-2xl sm:text-2xl md:text-3xl font-bold"
              >
                <QrCode className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mr-3 sm:mr-3 md:mr-4" />
                Pagar com PIX
              </Button>
              
              <Button
                onClick={() => handlePaymentMethod('card')}
                variant="secondary"
                className="h-28 sm:h-30 md:h-32 text-2xl sm:text-2xl md:text-3xl font-bold"
              >
                <CreditCard className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mr-3 sm:mr-3 md:mr-4" />
                Cartão
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemCheckout;
