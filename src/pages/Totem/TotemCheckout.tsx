import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, DollarSign, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!appointment || !session) {
      navigate('/totem/home');
      return;
    }
    
    loadAvailableServices();
    loadExistingCheckout();
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

  const loadExistingCheckout = async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Buscando venda existente para agendamento:', appointment?.id);

      // Carregar serviços extras existentes
      const { data: existingExtras, error: extrasError } = await supabase
        .from('appointment_extra_services')
        .select(`
          *,
          servico:painel_servicos(*)
        `)
        .eq('appointment_id', appointment.id);

      if (extrasError) {
        console.error('Erro ao buscar serviços extras:', extrasError);
      } else if (existingExtras && existingExtras.length > 0) {
        console.log('📦 Serviços extras encontrados:', existingExtras.length);
        setExtraServices(existingExtras.map((extra: any) => ({
          service_id: extra.service_id,
          nome: extra.servico.nome,
          preco: extra.servico.preco
        })));
      }

      // Buscar venda existente
      const { data: vendas, error: vendaError } = await supabase
        .from('vendas')
        .select('*')
        .eq('agendamento_id', appointment.id)
        .eq('status', 'ABERTA')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (vendaError) {
        console.error('Erro ao buscar venda:', vendaError);
        setLoading(false);
        return;
      }

      if (vendas && vendas.length > 0) {
        const venda = vendas[0];
        console.log('✅ Venda existente encontrada:', venda.id);
        
        // Buscar itens da venda
        const { data: itens, error: itensError } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', venda.id);

        if (itensError) {
          console.error('Erro ao buscar itens:', itensError);
          setLoading(false);
          return;
        }

        // Montar resumo a partir dos dados existentes
        const servicoPrincipal = itens.find(item => item.tipo === 'SERVICO' && item.ref_id === appointment.servico_id);
        const servicosExtras = itens.filter(item => item.tipo === 'SERVICO' && item.ref_id !== appointment.servico_id);

        const resumoData: CheckoutSummary = {
          original_service: {
            nome: servicoPrincipal?.nome || appointment.servico?.nome || '',
            preco: servicoPrincipal?.preco_unit || appointment.servico?.preco || 0
          },
          extra_services: servicosExtras.map(item => ({
            nome: item.nome,
            preco: item.preco_unit
          })),
          subtotal: venda.subtotal,
          discount: venda.desconto,
          total: venda.total
        };

        setVendaId(venda.id);
        setSessionId(session.id);
        setResumo(resumoData);
        setNeedsRecalculation(false);
        
        console.log('✅ Checkout carregado com sucesso');
      } else {
        console.log('⚠️ Nenhuma venda encontrada, iniciando novo checkout');
        await startCheckout();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar checkout', {
        description: 'Tente novamente'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraService = async (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      // Adicionar na tabela appointment_extra_services
      const { error } = await supabase
        .from('appointment_extra_services')
        .insert({
          appointment_id: appointment.id,
          service_id: service.id,
          added_by: session.id // Usando session_id como referência
        });

      if (error) {
        console.error('Erro ao adicionar serviço extra:', error);
        toast.error('Erro ao adicionar serviço', {
          description: 'Tente novamente'
        });
        return;
      }

      setExtraServices([...extraServices, {
        service_id: service.id,
        nome: service.nome,
        preco: service.preco
      }]);
      setNeedsRecalculation(true);
      toast.success('Serviço adicionado!', {
        description: `${service.nome} - R$ ${service.preco.toFixed(2)}`
      });
    }
  };

  const handleRemoveExtraService = async (index: number) => {
    const removedService = extraServices[index];
    
    // Remover da tabela appointment_extra_services
    const { error } = await supabase
      .from('appointment_extra_services')
      .delete()
      .eq('appointment_id', appointment.id)
      .eq('service_id', removedService.service_id);

    if (error) {
      console.error('Erro ao remover serviço extra:', error);
      toast.error('Erro ao remover serviço', {
        description: 'Tente novamente'
      });
      return;
    }

    setExtraServices(extraServices.filter((_, i) => i !== index));
    setNeedsRecalculation(true);
    toast.info('Serviço removido', {
      description: removedService.nome
    });
  };

  const startCheckout = async () => {
    if (!loading) {
      setLoading(true);
    }
    setIsUpdating(needsRecalculation);
    
    try {
      console.log('🛒 Iniciando/atualizando checkout para agendamento:', appointment?.id);

      // Não precisa mais enviar extras, pois já estão na tabela appointment_extra_services
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id
        }
      });

      if (error) {
        console.error('❌ Erro ao iniciar checkout:', error);
        toast.error('Erro ao processar checkout', {
          description: error.message || 'Tente novamente'
        });
        setLoading(false);
        setIsUpdating(false);
        return;
      }

      // Se recebeu uma resposta de fila, tentar buscar a venda existente
      if (data?.queued || !data?.success) {
        console.log('⏳ Requisição enfileirada ou falhou, buscando venda existente...');
        
        // Aguardar um pouco para o backend processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Buscar venda existente
        const { data: vendas, error: vendaError } = await supabase
          .from('vendas')
          .select('*')
          .eq('agendamento_id', appointment.id)
          .eq('status', 'ABERTA')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!vendaError && vendas && vendas.length > 0) {
          const venda = vendas[0];
          
          // Buscar itens da venda
          const { data: itens, error: itensError } = await supabase
            .from('vendas_itens')
            .select('*')
            .eq('venda_id', venda.id);

          if (!itensError && itens) {
            const servicoPrincipal = itens.find(item => item.tipo === 'SERVICO' && item.ref_id === appointment.servico_id);
            const servicosExtras = itens.filter(item => item.tipo === 'SERVICO' && item.ref_id !== appointment.servico_id);

            const resumoData: CheckoutSummary = {
              original_service: {
                nome: servicoPrincipal?.nome || appointment.servico?.nome || '',
                preco: servicoPrincipal?.preco_unit || appointment.servico?.preco || 0
              },
              extra_services: servicosExtras.map(item => ({
                nome: item.nome,
                preco: item.preco_unit
              })),
              subtotal: venda.subtotal,
              discount: venda.desconto,
              total: venda.total
            };

            setVendaId(venda.id);
            setSessionId(session.id);
            setResumo(resumoData);
            setNeedsRecalculation(false);
            
            if (isUpdating) {
              toast.success('Total atualizado!', {
                description: `Novo total: R$ ${venda.total.toFixed(2)}`
              });
            }
            
            console.log('✅ Checkout carregado da venda existente');
            setLoading(false);
            setIsUpdating(false);
            return;
          }
        }
        
        toast.error('Erro ao carregar checkout', {
          description: 'Não foi possível processar a venda. Tente novamente.'
        });
        setLoading(false);
        setIsUpdating(false);
        return;
      }

      console.log('✅ Checkout iniciado:', data);
      setVendaId(data.venda_id);
      setSessionId(data.session_id);
      setResumo(data.resumo);
      setNeedsRecalculation(false);
      
      if (isUpdating) {
        toast.success('Total atualizado!', {
          description: `Novo total: R$ ${data.resumo.total.toFixed(2)}`
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao processar o checkout'
      });
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const handleRecalculate = async () => {
    setIsUpdating(true);
    
    try {
      console.log('🔄 Recalculando total do checkout');

      // Deletar venda anterior se existir
      if (vendaId) {
        await supabase.from('vendas_itens').delete().eq('venda_id', vendaId);
        await supabase.from('vendas').delete().eq('id', vendaId);
      }

      // Criar nova venda (extras já estão na tabela appointment_extra_services)
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id
        }
      });

      if (error) throw error;

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Buscar venda atualizada
      const { data: vendas } = await supabase
        .from('vendas')
        .select('*')
        .eq('agendamento_id', appointment.id)
        .eq('status', 'ABERTA')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (vendas && vendas.length > 0) {
        const venda = vendas[0];
        
        const { data: itens } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', venda.id);

        if (itens) {
          const servicoPrincipal = itens.find(item => item.tipo === 'SERVICO' && item.ref_id === appointment.servico_id);
          const servicosExtras = itens.filter(item => item.tipo === 'SERVICO' && item.ref_id !== appointment.servico_id);

          const resumoData: CheckoutSummary = {
            original_service: {
              nome: servicoPrincipal?.nome || appointment.servico?.nome || '',
              preco: servicoPrincipal?.preco_unit || appointment.servico?.preco || 0
            },
            extra_services: servicosExtras.map(item => ({
              nome: item.nome,
              preco: item.preco_unit
            })),
            subtotal: venda.subtotal,
            discount: venda.desconto,
            total: venda.total
          };

          setVendaId(venda.id);
          setResumo(resumoData);
          setNeedsRecalculation(false);
          
          toast.success('Total atualizado!', {
            description: `Novo total: R$ ${venda.total.toFixed(2)}`
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao recalcular:', error);
      toast.error('Erro ao atualizar', {
        description: 'Não foi possível atualizar o total. Tente novamente.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentMethod = (method: 'pix' | 'card') => {
    if (!vendaId || !sessionId || !resumo) {
      toast.error('Erro', {
        description: 'Dados do checkout não encontrados'
      });
      return;
    }

    if (needsRecalculation) {
      toast.warning('Atualize o total primeiro', {
        description: 'Clique em "Atualizar Total" para recalcular com os novos serviços'
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

  if (loading && !isUpdating) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!resumo && !loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Erro ao carregar dados</p>
          <Button onClick={() => navigate('/totem/home')} className="bg-urbana-gold text-urbana-black active:bg-urbana-gold-dark">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden">
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 lg:h-16 px-3 sm:px-4 md:px-6 lg:px-8 text-sm sm:text-base md:text-lg lg:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-2 md:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Finalizar Atendimento
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-gray-light mt-0.5 sm:mt-1">Revise e confirme o pagamento</p>
        </div>
        <div className="w-12 sm:w-20 md:w-32 lg:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-6">
          
          {/* Add Extra Services Card */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-urbana-gold/20 shadow-2xl shadow-urbana-gold/10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-lg shadow-urbana-gold/30">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-black" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">
                Adicionar Serviços Extras
              </h2>
            </div>
            
            <div className="flex gap-2 sm:gap-3 md:gap-4">
              <Select onValueChange={handleAddExtraService} disabled={isUpdating}>
                <SelectTrigger className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl text-urbana-light bg-urbana-black/50 border-2 border-urbana-gray/50 hover:border-urbana-gold/50 transition-colors">
                  <SelectValue placeholder="Selecione um serviço extra" />
                </SelectTrigger>
                <SelectContent className="bg-card border-urbana-gold/30">
                  {availableServices.map((service) => (
                    <SelectItem 
                      key={service.id} 
                      value={service.id} 
                      className="text-base sm:text-lg text-urbana-light hover:bg-urbana-gold/10 cursor-pointer"
                    >
                      {service.nome} - <span className="text-urbana-gold font-bold">R$ {service.preco.toFixed(2)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {needsRecalculation && (
                <Button
                  onClick={handleRecalculate}
                  disabled={isUpdating}
                  className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold text-urbana-black font-bold hover:from-urbana-gold-dark hover:via-urbana-gold hover:to-urbana-gold-light shadow-lg shadow-urbana-gold/30 animate-pulse"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin mr-2" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      Atualizar Total
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* List of added extra services */}
            {extraServices.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm sm:text-base text-urbana-gray-light mb-2">Serviços adicionados:</p>
                {extraServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-urbana-black/40 rounded-xl border border-urbana-gold/20 group hover:border-urbana-gold/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-urbana-gold" />
                      <span className="text-sm sm:text-base md:text-lg text-urbana-light font-medium">
                        {service.nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg md:text-xl text-urbana-gold font-bold">
                        R$ {service.preco.toFixed(2)}
                      </span>
                      <Button
                        onClick={() => handleRemoveExtraService(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Summary Card */}
          {resumo && (
            <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/20">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light mb-6 pb-4 border-b-2 border-urbana-gold/30">
                Resumo do Atendimento
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {/* Original Service */}
                <div className="flex items-center justify-between py-3 sm:py-4 border-b border-urbana-gray/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-urbana-gold animate-pulse" />
                    <div>
                      <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                        {resumo.original_service.nome}
                      </p>
                      <p className="text-xs sm:text-sm text-urbana-gray-light">Serviço principal</p>
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-gold">
                    R$ {resumo.original_service.preco.toFixed(2)}
                  </p>
                </div>

                {/* Extra Services */}
                {resumo.extra_services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between py-3 sm:py-4 border-b border-urbana-gray/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-urbana-gold-light animate-pulse" />
                      <div>
                        <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                          {service.nome}
                        </p>
                        <p className="text-xs sm:text-sm text-urbana-gray-light">Serviço extra</p>
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-gold">
                      R$ {service.preco.toFixed(2)}
                    </p>
                  </div>
                ))}

                {/* Totals */}
                <div className="space-y-3 sm:space-y-4 pt-6 mt-6 border-t-2 border-urbana-gold/30">
                  <div className="flex items-center justify-between text-base sm:text-lg md:text-xl">
                    <span className="text-urbana-gray-light">Subtotal:</span>
                    <span className="text-urbana-light font-semibold">R$ {resumo.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {resumo.discount > 0 && (
                    <div className="flex items-center justify-between text-base sm:text-lg md:text-xl">
                      <span className="text-urbana-gray-light">Desconto:</span>
                      <span className="text-green-400 font-semibold">- R$ {resumo.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold-dark/10 rounded-2xl border-2 border-urbana-gold shadow-lg shadow-urbana-gold/20">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-light">TOTAL:</span>
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold animate-pulse">
                      R$ {resumo.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Method Selection */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-urbana-gold/20 shadow-2xl shadow-urbana-gold/10">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light mb-6 text-center">
              Selecione a forma de pagamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* PIX Button */}
              <button
                onClick={() => handlePaymentMethod('pix')}
                disabled={processing || needsRecalculation || isUpdating}
                className="group relative h-28 sm:h-32 md:h-36 lg:h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                    <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold" />
                  </div>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold">PIX</span>
                  <span className="text-xs sm:text-sm text-urbana-gray-light">Pagamento instantâneo</span>
                </div>
              </button>

              {/* Card Button */}
              <button
                onClick={() => handlePaymentMethod('card')}
                disabled={processing || needsRecalculation || isUpdating}
                className="group relative h-28 sm:h-32 md:h-36 lg:h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                    <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold" />
                  </div>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold">CARTÃO</span>
                  <span className="text-xs sm:text-sm text-urbana-gray-light">Crédito ou Débito</span>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TotemCheckout;
