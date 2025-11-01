import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, DollarSign, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfflineIndicator } from '@/components/totem/OfflineIndicator';

interface ServiceItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface CheckoutSummary {
  original_service: {
    nome: string;
    preco: number;
  };
  extra_services: Array<{
    nome: string;
    preco: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client, session } = location.state || {};
  const [vendaId, setVendaId] = useState<string | null>(null);
  const [resumo, setResumo] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [extraServices, setExtraServices] = useState<Array<{ service_id: string; nome: string; preco: number }>>([]);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);

  useEffect(() => {
    if (!appointment || !session) {
      navigate('/totem/home');
      return;
    }
    
    loadAvailableServices();
    startCheckout();
  }, [appointment, session]);

  const loadAvailableServices = async () => {
    try {
      const { data: services, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setAvailableServices(services || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleAddExtraService = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      setExtraServices([...extraServices, {
        service_id: service.id,
        nome: service.nome,
        preco: service.preco
      }]);
      setNeedsRecalculation(true);
    }
  };

  const handleRemoveExtraService = (index: number) => {
    setExtraServices(extraServices.filter((_, i) => i !== index));
    setNeedsRecalculation(true);
  };

  const startCheckout = async () => {
    setLoading(true);
    
    try {
      console.log('🛒 Iniciando checkout para agendamento:', appointment?.id);

      // Preparar lista de extras (serviços adicionados)
      const extras = extraServices.map(service => ({
        tipo: 'servico',
        id: service.service_id,
        quantidade: 1
      }));

      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id,
          extras: extras.length > 0 ? extras : undefined
        }
      });

      if (error) {
        console.error('❌ Erro ao iniciar checkout:', error);
        toast.error('Erro ao iniciar checkout', {
          description: error.message || 'Tente novamente'
        });
        return;
      }

      if (!data?.success) {
        console.error('❌ Falha ao iniciar checkout:', data?.error);
        toast.error('Erro ao iniciar checkout', {
          description: data?.error || 'Tente novamente'
        });
        return;
      }

      console.log('✅ Checkout iniciado:', data);
      setVendaId(data.venda_id);
      setSessionId(data.session_id);
      setResumo(data.resumo);
      setNeedsRecalculation(false);
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao iniciar o checkout'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = () => {
    startCheckout();
  };

  const handlePaymentMethod = (method: 'pix' | 'card') => {
    if (!vendaId || !sessionId || !resumo) {
      toast.error('Erro', {
        description: 'Dados do checkout não encontrados'
      });
      return;
    }

    if (needsRecalculation) {
      toast.warning('Recalcule o total', {
        description: 'Clique em Atualizar para recalcular com os novos serviços'
      });
      return;
    }

    setProcessing(true);

    if (method === 'pix') {
      navigate('/totem/payment-pix', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment: appointment,
          total: resumo.total
        }
      });
    } else {
      navigate('/totem/payment-card', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment: appointment,
          total: resumo.total
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <OfflineIndicator />
        <p className="text-3xl sm:text-4xl md:text-5xl text-urbana-light">Carregando...</p>
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <OfflineIndicator />
        <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light">Erro ao carregar dados do checkout</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      <OfflineIndicator />
      
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1">
          Checkout
        </h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-4">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-4 sm:space-y-6 md:space-y-8 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          
          {/* Add Extra Services Section */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-4 border-b-2 border-urbana-gold/20">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">
              Adicionar Serviços Extras
            </h2>
            
            <div className="flex gap-2 sm:gap-3 md:gap-4">
              <Select onValueChange={handleAddExtraService}>
                <SelectTrigger className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl text-urbana-light bg-urbana-black/50 border-2 border-urbana-gray/30">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id} className="text-base sm:text-lg">
                      {service.nome} - R$ {service.preco.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsRecalculation && (
                <Button
                  onClick={handleRecalculate}
                  className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl bg-urbana-gold text-urbana-black active:bg-urbana-gold-dark animate-pulse"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Atualizar
                </Button>
              )}
            </div>

            {/* List of added extra services */}
            {extraServices.length > 0 && (
              <div className="space-y-2">
                {extraServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-urbana-black/30 rounded-lg">
                    <span className="text-sm sm:text-base md:text-lg text-urbana-light">
                      {service.nome} - R$ {service.preco.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => handleRemoveExtraService(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light border-b-2 border-urbana-gold/20 pb-2 sm:pb-3 md:pb-4">
              Resumo do Atendimento
            </h2>

            {/* Original Service */}
            <div className="flex items-center justify-between py-2 sm:py-3 md:py-4 border-b border-urbana-gray/20">
              <div>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-urbana-light">
                  {resumo.original_service.nome}
                </p>
                <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">Serviço principal</p>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-gold">
                R$ {resumo.original_service.preco.toFixed(2)}
              </p>
            </div>

            {/* Extra Services */}
            {resumo.extra_services.map((service, index) => (
              <div key={index} className="flex items-center justify-between py-2 sm:py-3 md:py-4 border-b border-urbana-gray/20">
                <div>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-urbana-light">
                    {service.nome}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">Serviço extra</p>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-gold">
                  R$ {service.preco.toFixed(2)}
                </p>
              </div>
            ))}

            {/* Totals */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 pt-4 sm:pt-6 md:pt-8">
              <div className="flex items-center justify-between text-base sm:text-lg md:text-xl lg:text-2xl">
                <span className="text-urbana-light/80">Subtotal:</span>
                <span className="text-urbana-light font-semibold">R$ {resumo.subtotal.toFixed(2)}</span>
              </div>
              
              {resumo.discount > 0 && (
                <div className="flex items-center justify-between text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="text-urbana-light/80">Desconto:</span>
                  <span className="text-green-500 font-semibold">- R$ {resumo.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xl sm:text-2xl md:text-3xl lg:text-4xl pt-3 sm:pt-4 md:pt-6 border-t-2 border-urbana-gold/30">
                <span className="text-urbana-light font-bold">TOTAL:</span>
                <span className="text-urbana-gold font-bold">R$ {resumo.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 pt-4 sm:pt-6 md:pt-8">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-light">
              Selecione a forma de pagamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* PIX Button */}
              <Button
                onClick={() => handlePaymentMethod('pix')}
                disabled={processing || needsRecalculation}
                className="h-24 sm:h-28 md:h-32 lg:h-36 text-xl sm:text-2xl md:text-3xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-2 border-urbana-gold/50 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 disabled:opacity-50"
                variant="outline"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                  <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
                  <span>PIX</span>
                </div>
              </Button>

              {/* Card Button */}
              <Button
                onClick={() => handlePaymentMethod('card')}
                disabled={processing || needsRecalculation}
                className="h-24 sm:h-28 md:h-32 lg:h-36 text-xl sm:text-2xl md:text-3xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-2 border-urbana-gold/50 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 disabled:opacity-50"
                variant="outline"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                  <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
                  <span>CARTÃO</span>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemCheckout;
