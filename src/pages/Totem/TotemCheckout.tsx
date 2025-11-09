import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, DollarSign, Plus, Trash2, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExtraServicesUpsell } from '@/components/totem/ExtraServicesUpsell';
import { NextAppointmentScheduler } from '@/components/totem/NextAppointmentScheduler';

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
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product_id: string; nome: string; preco: number; quantidade: number }>>([]);

  useEffect(() => {
    if (!appointment || !session) {
      navigate('/totem/home');
      return;
    }
    
    loadAvailableServices();
    loadAvailableProducts();
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

  const loadAvailableProducts = async () => {
    try {
      const { data: products, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .eq('is_active', true)
        .gt('estoque', 0)
        .order('nome');

      if (error) throw error;
      setAvailableProducts(products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadExistingCheckout = async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Buscando venda existente para sessão:', session?.id, 'agendamento:', appointment?.id);

      // Carregar serviços extras existentes
      const { data: existingExtras, error: extrasError } = await supabase
        .from('appointment_extra_services')
        .select(`
          service_id,
          painel_servicos!inner (
            id,
            nome,
            preco
          )
        `)
        .eq('appointment_id', appointment.id);

      if (extrasError) {
        console.error('❌ Erro ao buscar serviços extras:', extrasError);
      } else if (existingExtras && existingExtras.length > 0) {
        console.log('📦 Serviços extras encontrados:', existingExtras.length);
        setExtraServices(existingExtras.map((extra: any) => ({
          service_id: extra.service_id,
          nome: extra.painel_servicos.nome,
          preco: extra.painel_servicos.preco
        })));
      }

      // Buscar venda existente PARA ESTA SESSÃO ESPECÍFICA
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('*')
        .eq('totem_session_id', session.id)
        .eq('status', 'ABERTA')
        .maybeSingle();

      if (vendaError) {
        console.error('❌ Erro ao buscar venda:', vendaError);
        // Não retornar, tentar criar venda
      }

      if (venda) {
        console.log('✅ Venda existente encontrada para sessão:', session.id, '- venda:', venda.id);
        
        // Buscar itens da venda
        const { data: itens, error: itensError } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', venda.id);

        if (itensError) {
          console.error('❌ Erro ao buscar itens:', itensError);
          // Tentar recriar venda
          console.log('⚠️ Tentando recriar venda...');
          await startCheckout();
          setLoading(false);
          return;
        }

        // Se não há itens, recriar venda
        if (!itens || itens.length === 0) {
          console.log('⚠️ Venda sem itens, recriando...');
          await startCheckout();
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
        
        console.log('✅ Checkout carregado com sucesso - Total:', venda.total);
      } else {
        console.log('⚠️ Nenhuma venda encontrada para sessão:', session.id, '- Iniciando novo checkout...');
        await startCheckout();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar checkout', {
        description: 'Tente novamente'
      });
      // Tentar criar venda mesmo com erro
      try {
        await startCheckout();
      } catch (e) {
        console.error('❌ Falha ao criar venda:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraService = async (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      console.log('➕ Adicionando serviço extra:', service.nome, 'ao agendamento:', appointment.id);
      
      // Adicionar na tabela appointment_extra_services
      const { data: insertData, error } = await supabase
        .from('appointment_extra_services')
        .insert({
          appointment_id: appointment.id,
          service_id: service.id
        })
        .select();

      if (error) {
        console.error('❌ Erro ao adicionar serviço extra:', error);
        toast.error('Erro ao adicionar serviço', {
          description: error.message || 'Tente novamente'
        });
        return;
      }

      console.log('✅ Serviço extra adicionado:', insertData);

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
    
    console.log('🗑️ Removendo serviço extra:', removedService.nome, 'do agendamento:', appointment.id);
    
    // Remover da tabela appointment_extra_services
    const { error } = await supabase
      .from('appointment_extra_services')
      .delete()
      .eq('appointment_id', appointment.id)
      .eq('service_id', removedService.service_id);

    if (error) {
      console.error('❌ Erro ao remover serviço extra:', error);
      toast.error('Erro ao remover serviço', {
        description: error.message || 'Tente novamente'
      });
      return;
    }

    console.log('✅ Serviço extra removido com sucesso');

    setExtraServices(extraServices.filter((_, i) => i !== index));
    setNeedsRecalculation(true);
    toast.info('Serviço removido', {
      description: removedService.nome
    });
  };

  const handleAddProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      const existingProduct = selectedProducts.find(p => p.product_id === productId);
      
      if (existingProduct) {
        if (existingProduct.quantidade >= product.estoque) {
          toast.error('Estoque insuficiente');
          return;
        }
        setSelectedProducts(selectedProducts.map(p =>
          p.product_id === productId
            ? { ...p, quantidade: p.quantidade + 1 }
            : p
        ));
      } else {
        setSelectedProducts([...selectedProducts, {
          product_id: product.id,
          nome: product.nome,
          preco: product.preco,
          quantidade: 1
        }]);
      }
      
      toast.success('Produto adicionado!', {
        description: `${product.nome} - R$ ${product.preco.toFixed(2)}`
      });
    }
  };

  const handleRemoveProduct = (index: number) => {
    const removedProduct = selectedProducts[index];
    
    if (removedProduct.quantidade > 1) {
      setSelectedProducts(selectedProducts.map((p, i) =>
        i === index
          ? { ...p, quantidade: p.quantidade - 1 }
          : p
      ));
    } else {
      setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
      toast.info('Produto removido', {
        description: removedProduct.nome
      });
    }
  };

  const startCheckout = async () => {
    if (!loading) {
      setLoading(true);
    }
    setIsUpdating(needsRecalculation);
    
    try {
      console.log('🛒 Iniciando checkout...');
      console.log('   📋 Agendamento ID:', appointment?.id);
      console.log('   🎫 Sessão ID:', session?.id);
      console.log('   👤 Cliente:', client?.nome);

      // Não precisa mais enviar extras, pois já estão na tabela appointment_extra_services
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id,
          session_id: session.id
        }
      });

      if (error) {
        console.error('❌ Erro ao iniciar checkout:', error);
        
        // Tratamento específico de erros
        let errorTitle = 'Erro ao processar checkout';
        let errorDescription = error.message || 'Não foi possível iniciar o checkout. Tente novamente.';
        
        // Verificar erros comuns
        if (error.message?.includes('já foi finalizado') || error.message?.includes('completed')) {
          errorTitle = 'Checkout já finalizado';
          errorDescription = `${client?.nome?.split(' ')[0]}, este serviço já foi finalizado. Agradecemos pela preferência!`;
        } else if (error.message?.includes('sessão') || error.message?.includes('session')) {
          errorTitle = 'Sessão expirada';
          errorDescription = 'Por favor, faça o check-in novamente para realizar o checkout.';
        } else if (error.message?.includes('agendamento') || error.message?.includes('appointment')) {
          errorTitle = 'Agendamento não encontrado';
          errorDescription = 'Não foi possível localizar seu agendamento. Procure a recepção.';
        }
        
        toast.error(errorTitle, {
          description: errorDescription,
          duration: 10000,
          style: {
            background: 'hsl(var(--urbana-brown))',
            color: 'hsl(var(--urbana-light))',
            border: '3px solid hsl(var(--urbana-gold))',
            fontSize: '1.25rem',
            padding: '1.5rem',
            maxWidth: '600px'
          }
        });
        
        setLoading(false);
        setIsUpdating(false);
        
        // Se for erro de checkout já finalizado ou sessão expirada, voltar para home
        if (error.message?.includes('finalizado') || error.message?.includes('completed') || 
            error.message?.includes('sessão') || error.message?.includes('session')) {
          setTimeout(() => navigate('/totem/home'), 3000);
        }
        
        return;
      }

      console.log('📦 Resposta da edge function:', data);

      // Se recebeu uma resposta de fila, tentar buscar a venda existente
      if (data?.queued || !data?.success) {
        console.log('⏳ Requisição enfileirada ou falhou, buscando venda existente...');
        
        // Aguardar um pouco para o backend processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Buscar venda existente PARA ESTA SESSÃO
        const { data: venda, error: vendaError } = await supabase
          .from('vendas')
          .select('*')
          .eq('totem_session_id', session.id)
          .eq('status', 'ABERTA')
          .maybeSingle();

        if (!vendaError && venda) {
          
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
      
      let errorDescription = 'Ocorreu um erro ao processar o checkout. Tente novamente.';
      
      // Verificar se é erro de rede ou timeout
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorDescription = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message?.includes('timeout')) {
        errorDescription = 'O processamento está demorando muito. Tente novamente em alguns instantes.';
      }
      
      toast.error('Erro inesperado', {
        description: errorDescription,
        duration: 10000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '3px solid hsl(var(--urbana-gold))',
          fontSize: '1.25rem',
          padding: '1.5rem',
          maxWidth: '600px'
        }
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
      
      // Buscar venda atualizada PARA ESTA SESSÃO
      const { data: venda } = await supabase
        .from('vendas')
        .select('*')
        .eq('totem_session_id', session.id)
        .eq('status', 'ABERTA')
        .maybeSingle();

      if (venda) {
        
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
    
    const totalWithProducts = resumo.total + selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);

    if (method === 'pix') {
      navigate('/totem/payment-pix', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment: appointment,
          client: client,
          total: totalWithProducts,
          selectedProducts: selectedProducts
        }
      });
    } else {
      navigate('/totem/payment-card', {
        state: {
          venda_id: vendaId,
          session_id: sessionId,
          appointment: appointment,
          client: client,
          total: totalWithProducts,
          selectedProducts: selectedProducts
        }
      });
    }
  };

  if (loading && !isUpdating) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center p-4">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-urbana-light font-poppins">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!resumo && !loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center p-4">
        <div className="text-center space-y-3 sm:space-y-4 max-w-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-urbana-light font-poppins font-bold">
            {client?.nome?.split(' ')[0]}, não foi possível carregar o checkout
          </p>
          <p className="text-sm sm:text-base md:text-lg text-urbana-light/60">
            Por favor, tente novamente ou procure a recepção para assistência.
          </p>
          <Button 
            onClick={() => navigate('/totem/home')} 
            className="bg-urbana-gold text-urbana-black active:bg-urbana-gold-dark text-sm sm:text-base md:text-lg h-10 sm:h-12 md:h-14 px-6 sm:px-8 md:px-10 mt-4"
          >
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
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold mb-1">
            Olá, {client?.nome?.split(' ')[0]}! ✨
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-gray-light">
            Revise seu atendimento e escolha a forma de pagamento
          </p>
        </div>
        <div className="w-12 sm:w-20 md:w-32 lg:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] px-2 sm:px-4">
          
          {/* Left Column - Services & Products */}
          <div className="flex flex-col gap-2 sm:gap-3 h-full overflow-y-auto">
            {/* Add Extra Services Card */}
            <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-urbana-gold/20 shadow-2xl shadow-urbana-gold/10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-lg shadow-urbana-gold/30">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-black" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light">
                  Adicionar Serviços
                </h2>
              </div>
              
              <div className="flex gap-2">
                <Select onValueChange={handleAddExtraService} disabled={isUpdating}>
                  <SelectTrigger className="flex-1 h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg text-urbana-light bg-urbana-black/50 border-2 border-urbana-gray/50 hover:border-urbana-gold/50 transition-colors">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-urbana-gold/30">
                    {availableServices.map((service) => (
                      <SelectItem 
                        key={service.id} 
                        value={service.id} 
                        className="text-sm sm:text-base text-urbana-light hover:bg-urbana-gold/10 cursor-pointer"
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
                    className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold text-urbana-black font-bold hover:from-urbana-gold-dark hover:via-urbana-gold hover:to-urbana-gold-light shadow-lg shadow-urbana-gold/30 animate-pulse"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                )}
              </div>

              {/* List of added extra services */}
              {extraServices.length > 0 && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {extraServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-urbana-black/40 rounded-lg border border-urbana-gold/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-urbana-gold flex-shrink-0" />
                        <span className="text-xs sm:text-sm md:text-base text-urbana-light font-medium truncate">
                          {service.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base md:text-lg text-urbana-gold font-bold whitespace-nowrap">
                          R$ {service.preco.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => handleRemoveExtraService(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                          disabled={isUpdating}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Add Products Card */}
            <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-urbana-gold/20 shadow-2xl shadow-urbana-gold/10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-urbana-gold-vibrant to-urbana-gold flex items-center justify-center shadow-lg shadow-urbana-gold-vibrant/30">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-black" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light">
                  Adicionar Produtos
                </h2>
              </div>
              
              <Select onValueChange={handleAddProduct} disabled={isUpdating}>
                <SelectTrigger className="w-full h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg text-urbana-light bg-urbana-black/50 border-2 border-urbana-gray/50 hover:border-urbana-gold/50 transition-colors">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="bg-card border-urbana-gold/30">
                  {availableProducts.map((product) => (
                    <SelectItem 
                      key={product.id} 
                      value={product.id} 
                      className="text-sm sm:text-base text-urbana-light hover:bg-urbana-gold/10 cursor-pointer"
                    >
                      {product.nome} - <span className="text-urbana-gold font-bold">R$ {product.preco.toFixed(2)}</span>
                      <span className="text-xs text-urbana-light/60 ml-2">(Est: {product.estoque})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* List of added products */}
              {selectedProducts.length > 0 && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {selectedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-urbana-black/40 rounded-lg border border-urbana-gold-vibrant/20">
                      <div className="flex items-center gap-2 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-urbana-gold-vibrant flex-shrink-0" />
                        <span className="text-xs sm:text-sm md:text-base text-urbana-light font-medium truncate">
                          {product.nome}
                        </span>
                        <span className="text-xs text-urbana-light/60">x{product.quantidade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base md:text-lg text-urbana-gold-vibrant font-bold whitespace-nowrap">
                          R$ {(product.preco * product.quantidade).toFixed(2)}
                        </span>
                        <Button
                          onClick={() => handleRemoveProduct(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                          disabled={isUpdating}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Summary Card */}
            {resumo && (
              <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/20 flex-1 overflow-y-auto">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-3 pb-2 border-b-2 border-urbana-gold/30">
                  Resumo
                </h2>

                <div className="space-y-2">
                  {/* Original Service */}
                  <div className="flex items-center justify-between py-2 border-b border-urbana-gray/20">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-urbana-gold animate-pulse flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-urbana-light truncate">
                          {resumo.original_service.nome}
                        </p>
                        <p className="text-[10px] sm:text-xs text-urbana-gray-light">Principal</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-urbana-gold whitespace-nowrap ml-2">
                      R$ {resumo.original_service.preco.toFixed(2)}
                    </p>
                  </div>

                  {/* Extra Services */}
                  {resumo.extra_services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-urbana-gray/20">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-urbana-gold-light animate-pulse flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-base font-semibold text-urbana-light truncate">
                            {service.nome}
                          </p>
                          <p className="text-[10px] sm:text-xs text-urbana-gray-light">Extra</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-urbana-gold whitespace-nowrap ml-2">
                        R$ {service.preco.toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {/* Products */}
                  {selectedProducts.map((product, index) => (
                    <div key={`product-${index}`} className="flex items-center justify-between py-2 border-b border-urbana-gray/20">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-urbana-gold-vibrant animate-pulse flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-base font-semibold text-urbana-light truncate">
                            {product.nome} x{product.quantidade}
                          </p>
                          <p className="text-[10px] sm:text-xs text-urbana-gray-light">Produto</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-urbana-gold-vibrant whitespace-nowrap ml-2">
                        R$ {(product.preco * product.quantidade).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="space-y-2 pt-3 mt-3 border-t-2 border-urbana-gold/30">
                    <div className="flex items-center justify-between text-xs sm:text-sm md:text-base">
                      <span className="text-urbana-gray-light">Subtotal:</span>
                      <span className="text-urbana-light font-semibold">R$ {(resumo.subtotal + selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantidade), 0)).toFixed(2)}</span>
                    </div>
                    
                    {resumo.discount > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base">
                        <span className="text-urbana-gray-light">Desconto:</span>
                        <span className="text-green-400 font-semibold">- R$ {resumo.discount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold-dark/10 rounded-xl border-2 border-urbana-gold shadow-lg shadow-urbana-gold/20">
                      <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-urbana-light">TOTAL:</span>
                      <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold animate-pulse">
                        R$ {(resumo.total + selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantidade), 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Payment */}
          <div className="flex flex-col gap-2 sm:gap-3 h-full">
            <Card className="flex-1 p-3 sm:p-4 md:p-5 bg-card/30 backdrop-blur-xl border-2 border-urbana-gold/20 shadow-2xl shadow-urbana-gold/10 flex flex-col">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-3 sm:mb-4 text-center">
                Forma de Pagamento
              </h3>

              <div className="flex-1 grid grid-cols-1 gap-3 sm:gap-4">
                {/* PIX Button */}
                <button
                  onClick={() => handlePaymentMethod('pix')}
                  disabled={processing || needsRecalculation || isUpdating}
                  className="group relative h-full min-h-[120px] bg-card/40 backdrop-blur-lg active:bg-card/60 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-urbana-gold-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-urbana-gold/20 backdrop-blur-sm group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
                    </div>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold">PIX</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-urbana-gray-light">Instantâneo</span>
                  </div>
                </button>

                {/* Card Button */}
                <button
                  onClick={() => handlePaymentMethod('card')}
                  disabled={processing || needsRecalculation || isUpdating}
                  className="group relative h-full min-h-[120px] bg-card/40 backdrop-blur-lg active:bg-card/60 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-urbana-gold-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-urbana-gold/20 backdrop-blur-sm group-hover:bg-urbana-gold/30 flex items-center justify-center transition-colors duration-300 group-hover:scale-110 transform">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
                    </div>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold">CARTÃO</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-urbana-gray-light">Crédito/Débito</span>
                  </div>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemCheckout;
