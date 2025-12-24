import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, DollarSign, Plus, Minus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExtraServicesUpsell } from '@/components/totem/ExtraServicesUpsell';
import { NextAppointmentScheduler } from '@/components/totem/NextAppointmentScheduler';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import barbershopBg from '@/assets/barbershop-background.jpg';

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
  // needsRecalculation removido - cálculo agora é automático
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product_id: string; nome: string; preco: number; quantidade: number; imagem?: string; estoque?: number }>>([]);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !session) {
      navigate('/totem/home');
      return;
    }
    
    loadAvailableServices();
    loadAvailableProducts();
    loadExistingCheckout();
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
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

      // 🔒 CORREÇÃO CRÍTICA: Buscar venda ABERTA por AGENDAMENTO, não só por sessão
      console.log('🔍 Buscando venda ABERTA por agendamento_id:', appointment.id);
      
      let venda;
      let vendaError;
      
      // Primeiro: tentar buscar venda pela sessão atual
      const vendaPorSessao = await supabase
        .from('vendas')
        .select('*')
        .eq('totem_session_id', session.id)
        .eq('status', 'ABERTA')
        .maybeSingle();
      
      if (vendaPorSessao.data) {
        console.log('✅ Venda encontrada pela sessão atual:', vendaPorSessao.data.id);
        venda = vendaPorSessao.data;
        vendaError = vendaPorSessao.error;
      } else {
        // Segundo: buscar qualquer venda ABERTA para este agendamento
        console.log('⚠️ Nenhuma venda na sessão atual. Buscando venda ABERTA por agendamento...');
        const vendaPorAgendamento = await supabase
          .from('vendas')
          .select('*')
          .eq('agendamento_id', appointment.id)
          .eq('status', 'ABERTA')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (vendaPorAgendamento.data) {
          console.log('✅ Venda ABERTA encontrada por agendamento:', vendaPorAgendamento.data.id);
          venda = vendaPorAgendamento.data;
          vendaError = vendaPorAgendamento.error;
          
          // 🔒 VINCULAR venda à sessão atual
          console.log('🔄 Vinculando venda', venda.id, 'à sessão atual:', session.id);
          await supabase
            .from('vendas')
            .update({ totem_session_id: session.id })
            .eq('id', venda.id);
          
          toast.info('Checkout retomado', {
            description: 'Encontramos seu checkout em aberto!'
          });
        } else {
          vendaError = vendaPorAgendamento.error;
        }
      }

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

        // 🔍 Montar resumo a partir dos itens da venda
        console.log('📦 Itens encontrados na venda:', itens.length);
        
        const servicoPrincipal = itens.find(item => 
          item.tipo === 'SERVICO' && 
          (item.ref_id === appointment.servico_id || item.ref_id === appointment.servico?.id)
        );
        
        const servicosExtras = itens.filter(item => 
          item.tipo === 'SERVICO' && 
          item.ref_id !== appointment.servico_id &&
          item.ref_id !== appointment.servico?.id
        );

        console.log('🎯 Serviço principal:', servicoPrincipal?.nome || 'NÃO ENCONTRADO');
        console.log('➕ Serviços extras:', servicosExtras.length);

        if (!servicoPrincipal) {
          console.error('❌ ERRO: Serviço principal não encontrado nos itens!');
          console.log('   Serviço esperado ID:', appointment.servico_id || appointment.servico?.id);
          console.log('   Itens disponíveis:', itens.map(i => ({ tipo: i.tipo, ref_id: i.ref_id, nome: i.nome })));
        }

        const resumoData: CheckoutSummary = {
          original_service: {
            nome: servicoPrincipal?.nome || appointment.servico?.nome || 'Serviço Principal',
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
        // Cálculo automático - não precisa de needsRecalculation
        
        console.log('✅ Checkout carregado - Venda:', venda.id, 'Total: R$', venda.total);
        console.log('📋 Resumo:', resumoData);
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
      // NÃO mais precisa de needsRecalculation - cálculo é automático
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
    // NÃO mais precisa de needsRecalculation - cálculo é automático
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
        toast.success('Quantidade atualizada!', {
          description: `${product.nome} - ${existingProduct.quantidade + 1} unidades`
        });
      } else {
        const productImage = product.imagens && Array.isArray(product.imagens) && product.imagens.length > 0 
          ? product.imagens[0] 
          : undefined;
        setSelectedProducts([...selectedProducts, {
          product_id: product.id,
          nome: product.nome,
          preco: product.preco,
          quantidade: 1,
          imagem: productImage,
          estoque: product.estoque
        }]);
        toast.success('Produto adicionado!', {
          description: `${product.nome} - R$ ${product.preco.toFixed(2)}`
        });
      }
    }
  };

  const handleIncreaseProductQuantity = (productId: string) => {
    const product = selectedProducts.find(p => p.product_id === productId);
    const availableProduct = availableProducts.find(p => p.id === productId);
    
    if (product && availableProduct) {
      if (product.quantidade >= availableProduct.estoque) {
        toast.error('Estoque insuficiente', {
          description: `Disponível: ${availableProduct.estoque} unidades`
        });
        return;
      }
      
      setSelectedProducts(selectedProducts.map(p =>
        p.product_id === productId
          ? { ...p, quantidade: p.quantidade + 1 }
          : p
      ));
    }
  };

  const handleDecreaseProductQuantity = (productId: string) => {
    const product = selectedProducts.find(p => p.product_id === productId);
    
    if (product) {
      if (product.quantidade <= 1) {
        // Remover produto
        setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
        toast.info('Produto removido', {
          description: product.nome
        });
      } else {
        setSelectedProducts(selectedProducts.map(p =>
          p.product_id === productId
            ? { ...p, quantidade: p.quantidade - 1 }
            : p
        ));
      }
    }
  };

  // Cálculo automático do total - SEMPRE recalcula com base nos valores atuais
  const productsTotal = selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
  const extraServicesTotal = extraServices.reduce((sum, s) => sum + s.preco, 0);
  
  // O total REAL é: serviço principal + serviços extras (locais) + produtos
  const baseServicePrice = resumo?.original_service?.preco || 0;
  const grandTotal = baseServicePrice + extraServicesTotal + productsTotal;
  
  // Total para display (usa o resumo se não tiver serviços extras locais ainda sincronizados)
  const displayTotal = (resumo?.total || baseServicePrice) + extraServicesTotal - (resumo?.extra_services?.reduce((sum, s) => sum + s.preco, 0) || 0) + productsTotal;

  const startCheckout = async () => {
    if (!loading) {
      setLoading(true);
    }
    // isUpdating já é gerenciado pelo loading
    
    try {
      console.log('🛒 [CHECKOUT] Iniciando checkout...');
      console.log('   📋 Agendamento ID:', appointment?.id);
      console.log('   🎫 Sessão ID:', session?.id);
      console.log('   👤 Cliente:', client?.nome);

      // Não precisa mais enviar extras, pois já estão na tabela appointment_extra_services
      console.log('📡 [CHECKOUT] Chamando edge function totem-checkout...');
      
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id,
          session_id: session.id
        }
      });

      console.log('📥 [CHECKOUT] Resposta recebida:', { data, error });

      if (error) {
        console.error('❌ [CHECKOUT] Erro ao iniciar checkout:', error);
        
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

      console.log('📦 [CHECKOUT] Resposta da edge function:', data);

      // Se recebeu uma resposta de fila, tentar buscar a venda existente
      if (data?.queued || !data?.success) {
        console.log('⏳ [CHECKOUT] Requisição enfileirada ou falhou, buscando venda existente...');
        
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
            // Cálculo automático - não precisa de needsRecalculation
            
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

      console.log('✅ [CHECKOUT] Checkout iniciado:', data);
      console.log('   💰 Venda ID:', data.venda_id);
      console.log('   🎫 Session ID:', data.session_id);
      console.log('   💵 Total:', data.resumo.total);
      
      setVendaId(data.venda_id);
      setSessionId(data.session_id);
      setResumo(data.resumo);
      // Cálculo automático - não precisa de needsRecalculation
      
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
          // Cálculo automático - não precisa de needsRecalculation
          
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

  const handlePaymentMethod = async (method: 'pix' | 'card') => {
    // Usa o grandTotal já calculado automaticamente (baseServicePrice + extraServicesTotal + productsTotal)
    const finalTotal = grandTotal;
    
    console.log('💳 [PAYMENT] Iniciando pagamento:', method);
    console.log('   💰 Venda ID:', vendaId);
    console.log('   🎫 Session ID:', sessionId);
    console.log('   💵 Grand Total (calculado):', finalTotal);
    
    if (!vendaId || !sessionId) {
      console.error('❌ [PAYMENT] Dados do checkout ausentes:', { vendaId, sessionId });
      toast.error('Erro', {
        description: 'Dados do checkout não encontrados. Aguarde o carregamento.'
      });
      return;
    }

    if (finalTotal <= 0) {
      console.error('❌ [PAYMENT] Total inválido:', finalTotal);
      toast.error('Erro', {
        description: 'Total do pagamento é inválido.'
      });
      return;
    }

    setProcessing(true);
    
    try {
      console.log('📊 Cálculo do total final:');
      console.log('   💈 Serviço base:', baseServicePrice);
      console.log('   ➕ Extras:', extraServicesTotal);
      console.log('   🛒 Produtos:', productsTotal);
      console.log('   💰 Total final:', finalTotal);
      
      // 🔒 Salvar produtos ANTES do pagamento
      if (selectedProducts.length > 0) {
        console.log('💾 Salvando produtos em vendas_itens ANTES do pagamento');
        
        const productItems = selectedProducts.map(product => ({
          venda_id: vendaId,
          tipo: 'PRODUTO',
          ref_id: product.product_id,
          nome: product.nome,
          quantidade: product.quantidade,
          preco_unit: product.preco,
          total: product.preco * product.quantidade
        }));

        const { error: itemsError } = await supabase
          .from('vendas_itens')
          .insert(productItems);

        if (itemsError) {
          console.error('❌ Erro ao salvar produtos:', itemsError);
          toast.error('Erro ao adicionar produtos', {
            description: 'Tente novamente'
          });
          setProcessing(false);
          return;
        }

        console.log('✅ Produtos salvos com sucesso');
      }

      // Atualizar total da venda no banco
      const { error: updateError } = await supabase
        .from('vendas')
        .update({
          subtotal: finalTotal,
          total: finalTotal
        })
        .eq('id', vendaId);

      if (updateError) {
        console.error('❌ Erro ao atualizar total:', updateError);
      } else {
        console.log('✅ Total atualizado no banco:', finalTotal);
      }

      console.log('✅ [PAYMENT] Navegando para tela de pagamento:', method);
      console.log('   💰 Venda ID:', vendaId);
      console.log('   🎫 Session ID:', sessionId);
      console.log('   💵 Total final:', finalTotal);

      if (method === 'pix') {
        navigate('/totem/payment-pix', {
          state: {
            venda_id: vendaId,
            session_id: sessionId,
            appointment: appointment,
            client: client,
            total: finalTotal,
            selectedProducts: selectedProducts,
            extraServices: extraServices,
            resumo: resumo
          }
        });
      } else {
        navigate('/totem/payment-card', {
          state: {
            venda_id: vendaId,
            session_id: sessionId,
            appointment: appointment,
            client: client,
            total: finalTotal,
            selectedProducts: selectedProducts,
            extraServices: extraServices,
            resumo: resumo
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      toast.error('Erro ao processar', {
        description: 'Tente novamente'
      });
      setProcessing(false);
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden relative">
      
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
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="sm"
          className="h-9 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Olá, {client?.nome?.split(' ')[0]}! ✨
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-urbana-gray-light">
            Revise seu atendimento e escolha a forma de pagamento
          </p>
        </div>
        <div className="w-10 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 flex items-start justify-center overflow-hidden pb-2">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 px-1 sm:px-2 h-full">
          
          {/* Left Column - Services & Products */}
          <div className="flex flex-col gap-2 sm:gap-3 overflow-hidden">
            {/* Add Extra Services Card */}
            <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-lg shadow-urbana-gold/30">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-urbana-black" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light">
                  Adicionar Serviços
                </h2>
              </div>
              
              <div className="flex gap-2">
                <Select onValueChange={handleAddExtraService} disabled={isUpdating}>
                  <SelectTrigger className="flex-1 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base text-urbana-light bg-urbana-black-soft/30 backdrop-blur-md border-2 border-urbana-gold/40 hover:border-urbana-gold/60 transition-colors">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent className="bg-urbana-black-soft backdrop-blur-xl border-urbana-gold/30">
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
                
                {/* Botão de recalcular removido - cálculo agora é automático */}
              </div>

              {/* List of added extra services */}
              {extraServices.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
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
            <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-urbana-gold-vibrant to-urbana-gold flex items-center justify-center shadow-lg shadow-urbana-gold-vibrant/30">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-urbana-black" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light">
                  Adicionar Produtos
                </h2>
              </div>
              
              <Select onValueChange={handleAddProduct} disabled={isUpdating}>
                <SelectTrigger className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base text-urbana-light bg-urbana-black-soft/30 backdrop-blur-md border-2 border-urbana-gold/40 hover:border-urbana-gold/60 transition-colors">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="bg-urbana-black-soft backdrop-blur-xl border-urbana-gold/30">
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

              {/* List of added products with quantity controls */}
              {selectedProducts.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-2 sm:p-3 bg-urbana-black/40 rounded-lg border border-urbana-gold-vibrant/20">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Product Thumbnail */}
                        {product.imagem ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-urbana-black/50 border border-urbana-gold-vibrant/30 flex-shrink-0">
                            <img 
                              src={product.imagem} 
                              alt={product.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-urbana-gold-vibrant/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-urbana-gold-vibrant" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm text-urbana-light font-medium truncate">
                            {product.nome}
                          </span>
                          <span className="text-[10px] sm:text-xs text-urbana-gold-vibrant font-bold">
                            R$ {product.preco.toFixed(2)} un.
                          </span>
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-urbana-black/60 rounded-lg border border-urbana-gold/30 p-1">
                          <Button
                            onClick={() => handleDecreaseProductQuantity(product.product_id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-urbana-light hover:text-red-400 hover:bg-red-500/10"
                            disabled={isUpdating}
                          >
                            {product.quantidade <= 1 ? (
                              <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          
                          <span className="w-8 text-center text-sm sm:text-base font-bold text-urbana-gold">
                            {product.quantidade}
                          </span>
                          
                          <Button
                            onClick={() => handleIncreaseProductQuantity(product.product_id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
                            disabled={isUpdating || (product.estoque !== undefined && product.quantidade >= product.estoque)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        
                        <span className="text-sm sm:text-base text-urbana-gold-vibrant font-bold whitespace-nowrap min-w-[70px] text-right">
                          R$ {(product.preco * product.quantidade).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Products Subtotal */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-urbana-gold-vibrant/30">
                    <span className="text-xs sm:text-sm text-urbana-light/70 font-medium">
                      Subtotal Produtos ({selectedProducts.reduce((sum, p) => sum + p.quantidade, 0)} itens):
                    </span>
                    <span className="text-sm sm:text-base text-urbana-gold-vibrant font-bold">
                      R$ {productsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Center Column - Summary Card */}
          {resumo && (
            <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/10 overflow-hidden flex flex-col">
              <h2 className="text-sm sm:text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold mb-2 pb-2 border-b-2 border-urbana-gold/40">
                Resumo do Atendimento
              </h2>

              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[calc(100vh-350px)]">
                {/* Original Service */}
                <div className="flex items-center justify-between py-1.5 border-b border-urbana-gray/30">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-urbana-gold animate-pulse flex-shrink-0" />
                    <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-urbana-light truncate">
                      {resumo.original_service.nome}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-urbana-gold whitespace-nowrap ml-2">
                    R$ {resumo.original_service.preco.toFixed(2)}
                  </p>
                </div>

                {/* Extra Services */}
                {resumo.extra_services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5 border-b border-urbana-gray/30">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-urbana-gold-light animate-pulse flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-urbana-light truncate">
                        {service.nome}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-urbana-gold whitespace-nowrap ml-2">
                      R$ {service.preco.toFixed(2)}
                    </p>
                  </div>
                ))}

                {/* Products */}
                {selectedProducts.map((product, index) => (
                  <div key={`product-${index}`} className="flex items-center justify-between py-2 border-b border-urbana-gray/30">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Product Image */}
                      {product.imagem ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-urbana-black/50 border border-urbana-gold/30 flex-shrink-0">
                          <img 
                            src={product.imagem} 
                            alt={product.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-urbana-gold-vibrant/20 border border-urbana-gold-vibrant/30 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-urbana-gold-vibrant animate-pulse" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-urbana-light truncate">
                          {product.nome}
                        </p>
                        <span className="text-[9px] sm:text-[10px] text-urbana-light/60">
                          Qtd: {product.quantidade}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-urbana-gold-vibrant whitespace-nowrap ml-2">
                      R$ {(product.preco * product.quantidade).toFixed(2)}
                    </p>
                  </div>
                ))}

                {/* Totals - Cálculo automático */}
                <div className="space-y-2 pt-2 mt-2 border-t-2 border-urbana-gold/40">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-urbana-light/80 font-medium">Subtotal:</span>
                    <span className="text-urbana-light font-bold">
                      R$ {(resumo.original_service.preco + extraServicesTotal + productsTotal).toFixed(2)}
                    </span>
                  </div>
                  
                  {resumo.discount > 0 && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-urbana-light/80 font-medium">Desconto:</span>
                      <span className="text-green-400 font-bold">- R$ {resumo.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/20 to-urbana-gold/20 rounded-xl border-2 border-urbana-gold shadow-xl shadow-urbana-gold/30 mt-2">
                    <span className="text-sm sm:text-base md:text-lg font-black text-urbana-light">TOTAL:</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
                      R$ {(resumo.original_service.preco + extraServicesTotal + productsTotal - resumo.discount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Right Column - Payment */}
          <div className="flex flex-col gap-3 sm:gap-4 lg:sticky lg:top-0">
            <Card className="p-3 sm:p-4 md:p-5 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/10">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-urbana-light mb-2 sm:mb-3 text-center">
                Forma de Pagamento
              </h3>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* PIX Button */}
                <button
                  onClick={() => handlePaymentMethod('pix')}
                  disabled={processing || isUpdating}
                  className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                    </div>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">PIX</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Instantâneo</span>
                  </div>
                </button>

                {/* Card Button */}
                <button
                  onClick={() => handlePaymentMethod('card')}
                  disabled={processing || isUpdating}
                  className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                    </div>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">CARTÃO</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Débito/Crédito</span>
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
