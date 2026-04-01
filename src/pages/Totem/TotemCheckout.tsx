import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle2, User, Award, Heart, Package, Plus, Crown, Sparkles, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { useClientSubscriptionCredits } from '@/hooks/totem/useClientSubscriptionCredits';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import TotemReceiptOptionsModal from '@/components/totem/TotemReceiptOptionsModal';
import TotemCheckoutExtrasModal, {
  CheckoutExtraService,
  CheckoutProductCartItem
} from '@/components/totem/TotemCheckoutExtrasModal';
import { useComboDetection } from '@/hooks/totem/useComboDetection';

interface CheckoutSummary {
  original_service: {
    nome: string;
    preco: number;
  };
  extra_services?: Array<{
    nome: string;
    preco: number;
  }>;
  products?: Array<{
    nome: string;
    preco: number;
    quantidade: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
}

interface BarberInfo {
  id: string;
  nome: string;
  foto_url?: string;
  image_url?: string;
  especialidade?: string;
}

// Formatação de moeda em centavos: cada dígito digitado adiciona ao final
// 1 -> 0,01 | 12 -> 0,12 | 123 -> 1,23 | 1234 -> 12,34 | 12345 -> 123,45
function formatCurrencyFromDigits(rawDigits: string): { display: string; value: number } {
  // Remove tudo que não é dígito e limita a 7 dígitos (máximo R$ 99.999,99)
  const digits = (rawDigits || '').replace(/\D/g, '').slice(0, 7);
  
  // Converte para número em centavos e depois para reais
  const cents = parseInt(digits || '0', 10);
  const value = cents / 100;
  
  // Formata para exibição
  const display = value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return { display, value };
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { appointment, client, session } = location.state || {};

  // Itens editáveis no CHECKOUT (como era antigamente)
  const [extraServices, setExtraServices] = useState<CheckoutExtraService[]>(location.state?.extraServices || []);
  const [productCart, setProductCart] = useState<CheckoutProductCartItem[]>(location.state?.productCart || []);
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);

  const [barber, setBarber] = useState<BarberInfo | null>(() => {
    // Usar dados do barbeiro já trazidos na navegação para render imediato
    const b = appointment?.barbeiro;
    if (b) return { id: b.id, nome: b.nome, foto_url: b.foto_url, image_url: b.image_url };
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipInput, setTipInput] = useState<string>('0,00');
  const [vendaId, setVendaId] = useState<string | null>(null);
  const vendaIdRef = useRef<string | null>(null);
  const [usingCredit, setUsingCredit] = useState(false);
  
  // Combo detection
  const { detectCombo } = useComboDetection();
  const [comboMatch, setComboMatch] = useState<{
    combo_nome: string;
    combo_preco: number;
    savings: number;
    component_ids: string[];
  } | null>(null);
  
  // Receipt modal state (for subscription credit checkout)
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Subscription credits hook
  const { activeSubscription, checkCredits, useCredit } = useClientSubscriptionCredits();

  // ============================================================
  // CÁLCULO AUTOMÁTICO EM TEMPO REAL (sem depender de rede)
  // ============================================================
  const originalService = useMemo(() => {
    const nome = appointment?.servico?.nome || 'Serviço';
    const preco = Number(appointment?.servico?.preco) || 0;
    return { nome, preco };
  }, [appointment?.servico?.nome, appointment?.servico?.preco]);

  const extraServicesTotal = useMemo(
    () => extraServices.reduce((sum, s) => sum + (Number(s.preco) || 0), 0),
    [extraServices]
  );

  const productsTotal = useMemo(
    () => productCart.reduce((sum, p) => sum + (Number(p.preco) || 0) * (p.quantidade || 1), 0),
    [productCart]
  );

  const comboDiscount = comboMatch?.savings || 0;

  const subtotal = useMemo(
    () => originalService.preco + extraServicesTotal + productsTotal - comboDiscount,
    [originalService.preco, extraServicesTotal, productsTotal, comboDiscount]
  );

  const totalComGorjeta = useMemo(() => subtotal + tipAmount, [subtotal, tipAmount]);

  // Verifica se o serviço do agendamento está coberto pelo plano de assinatura
  const isServiceCoveredByPlan = useMemo(() => {
    if (!activeSubscription || !appointment?.servico_id) return false;
    if (activeSubscription.allowed_service_ids.length === 0) return false;
    return activeSubscription.allowed_service_ids.includes(appointment.servico_id);
  }, [activeSubscription, appointment?.servico_id]);

  // Calcula quantos créditos o serviço agendado custa
  const serviceCreditsCost = useMemo(() => {
    if (!activeSubscription || !appointment?.servico_id) return 1;
    return activeSubscription.service_credits_map[appointment.servico_id] || 1;
  }, [activeSubscription, appointment?.servico_id]);

  // Verifica se o cliente tem créditos suficientes para o serviço
  const hasEnoughCredits = useMemo(() => {
    if (!activeSubscription) return false;
    return activeSubscription.credits_remaining >= serviceCreditsCost;
  }, [activeSubscription, serviceCreditsCost]);

  // Resumo local sempre atualizado automaticamente
  const resumo: CheckoutSummary = useMemo(() => ({
    original_service: originalService,
    extra_services: extraServices.map((s) => ({ nome: s.nome, preco: s.preco })),
    products: productCart.map((p) => ({ nome: p.nome, preco: p.preco, quantidade: p.quantidade })),
    subtotal,
    discount: comboDiscount,
    total: subtotal,
  }), [originalService, extraServices, productCart, subtotal, comboDiscount]);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');

    if (!appointment || !session) {
      navigate('/totem/home');
      return;
    }

    loadCheckout();

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id, session?.id]);

  const loadCheckout = async () => {
    setLoading(true);
    try {
      // Mostrar UI imediatamente — edge function roda em background
      setLoading(false);

      const checkoutBody = {
        action: 'start',
        agendamento_id: appointment.id,
        session_id: session.id,
        extras: extraServices.map((s) => ({
          id: s.id, nome: s.nome, preco: s.preco, tipo: 'SERVICO_EXTRA',
        })),
        products: productCart.map((p) => ({
          id: p.id, nome: p.nome, preco: p.preco, quantidade: p.quantidade,
        })),
      };

      // Tudo em paralelo, sem bloquear a UI
      const [, barberResult, checkoutResult] = await Promise.allSettled([
        client?.id ? checkCredits(client.id) : Promise.resolve(),
        // Buscar barbeiro completo apenas se não veio da navegação
        !barber && appointment?.barbeiro_id
          ? supabase.from('painel_barbeiros').select('id, nome, foto_url, image_url, specialties').eq('id', appointment.barbeiro_id).single()
          : Promise.resolve({ data: null }),
        supabase.functions.invoke('totem-checkout', { body: checkoutBody }),
      ]);

      // Atualizar barbeiro se buscou
      if (barberResult.status === 'fulfilled') {
        const barberData = (barberResult.value as any)?.data;
        if (barberData) {
          setBarber({
            id: barberData.id,
            nome: barberData.nome,
            foto_url: barberData.foto_url || barberData.image_url,
            image_url: barberData.image_url,
            especialidade: Array.isArray(barberData.specialties)
              ? barberData.specialties.join(', ')
              : (barberData.specialties as any),
          });
        }
      }

      if (checkoutResult.status === 'fulfilled') {
        const { data: checkoutData, error: checkoutError } = checkoutResult.value as any;
        if (checkoutError) {
          console.error('Erro ao iniciar checkout:', checkoutError);
        } else if (checkoutData?.venda_id) {
          vendaIdRef.current = checkoutData.venda_id;
          setVendaId(checkoutData.venda_id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      setLoading(false);
    }
  };

  const handleTipChange = (value: string) => {
    // Formatação automática em centavos: cada dígito adiciona ao final
    // 1 -> 0,01 | 12 -> 0,12 | 123 -> 1,23 | 1234 -> 12,34
    const digits = value.replace(/\D/g, '');
    const { display, value: amount } = formatCurrencyFromDigits(digits);
    setTipInput(display);
    setTipAmount(amount);
  };

  const syncItemsAndReloadSummary = async (nextExtras: CheckoutExtraService[], nextProducts: CheckoutProductCartItem[]) => {
    // Atualiza estados locais IMEDIATAMENTE (total recalcula automático via useMemo)
    setExtraServices(nextExtras);
    setProductCart(nextProducts);

    // Detectar combo automaticamente
    if (appointment?.servico_id && nextExtras.length > 0) {
      const mainId = appointment.servico_id;
      const mainPreco = Number(appointment?.servico?.preco) || 0;
      const extraIds = nextExtras.map((s) => s.id);
      const extraPrices: Record<string, number> = {};
      nextExtras.forEach((s) => { extraPrices[s.id] = Number(s.preco) || 0; });

      const result = await detectCombo(mainId, mainPreco, extraIds, extraPrices);
      if (result.found && result.combo) {
        setComboMatch({
          combo_nome: result.combo.combo_nome,
          combo_preco: result.combo.combo_preco,
          savings: result.combo.savings,
          component_ids: result.combo.component_ids,
        });
        toast.success(`Combo detectado: ${result.combo.combo_nome} — economia de R$ ${result.combo.savings.toFixed(2)}! 🎉`);
      } else {
        setComboMatch(null);
      }
    } else {
      setComboMatch(null);
    }

    // Sincroniza com backend (idempotente) em background
    try {
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id,
          session_id: session.id,
          extras: nextExtras.map((s) => ({ id: s.id, nome: s.nome, preco: s.preco, tipo: 'SERVICO_EXTRA' })),
          products: nextProducts.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, quantidade: p.quantidade })),
        },
      });
      if (!error && data?.venda_id) {
        vendaIdRef.current = data.venda_id;
        setVendaId(data.venda_id);
      }
    } catch (e) {
      console.error('[TotemCheckout] Erro ao sincronizar itens:', e);
    }
  };

  // Handler para usar crédito da assinatura (bypass PayGo)
  const handleUseCredit = async () => {
    if (!activeSubscription || !hasEnoughCredits) return;
    setProcessing(true);
    try {
      // 1. Usar crédito da assinatura PRIMEIRO
      const success = await useCredit(
        activeSubscription.id,
        appointment.id,
        resumo.original_service.nome,
        serviceCreditsCost
      );

      if (!success) {
        toast.error('Erro ao usar crédito. Tente novamente.');
        setProcessing(false);
        return;
      }

      // 2. Garantir que temos vendaId (resolver race condition)
      let currentVendaId = vendaIdRef.current;
      if (!currentVendaId) {
        console.warn('[SUBSCRIPTION] vendaId não disponível, criando venda via start...');
        const { data: startData } = await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'start',
            agendamento_id: appointment.id,
            session_id: session.id,
            extras: [],
            products: [],
          }
        });
        if (startData?.venda_id) {
          currentVendaId = startData.venda_id;
          vendaIdRef.current = currentVendaId;
          setVendaId(currentVendaId);
        }
      }

      // 3. Atualizar venda para refletir pagamento via assinatura
      if (currentVendaId) {
        await supabase.from('vendas').update({
          valor_total: 0,
          forma_pagamento: 'ASSINATURA',
          status: 'pago',
          gorjeta: 0,
          observacoes: `Crédito assinatura ${activeSubscription.plan_name} - ${serviceCreditsCost} crédito(s) usado(s) - Total: ${activeSubscription.credits_used + serviceCreditsCost}/${activeSubscription.credits_total}`
        }).eq('id', currentVendaId);
      }

      // 4. Finalizar checkout via edge function (sem PayGo, com ERP completo)
      if (currentVendaId) {
        await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: currentVendaId,
            session_id: session.id,
            agendamento_id: appointment.id,
            payment_method: 'subscription_credit',
            tipAmount: 0,
            extras: extraServices.map(s => ({ id: s.id, nome: s.nome, preco: s.preco, tipo: 'SERVICO_EXTRA' })),
            products: productCart.map(p => ({ id: p.id, nome: p.nome, preco: p.preco, quantidade: p.quantidade })),
          }
        });
      } else {
        console.error('[SUBSCRIPTION] Impossível finalizar checkout: vendaId indisponível');
        // Mesmo sem vendaId, marcar agendamento como finalizado para não travar
        await supabase.from('painel_agendamentos').update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          updated_at: new Date().toISOString()
        }).eq('id', appointment.id);
      }

      toast.success(`Crédito utilizado! (${activeSubscription.credits_remaining - 1} restantes) ✨`);
      
      // 5. Mostrar modal de comprovante (igual ao fluxo normal)
      setProcessing(false);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Erro ao usar crédito:', error);
      toast.error('Erro ao processar crédito');
      setProcessing(false);
    }
  };

  // Handler para envio de e-mail de comprovante (assinatura)
  const handleSendSubscriptionReceiptEmail = useCallback(async (): Promise<boolean> => {
    if (!client?.email) return false;

    try {
      const creditsRemaining = activeSubscription 
        ? activeSubscription.credits_remaining - 1 
        : 0;
      const nextBillingDate = activeSubscription?.next_billing_date
        ? format(new Date(activeSubscription.next_billing_date + 'T12:00:00'), 'dd/MM/yyyy')
        : null;

      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      // Serviço principal (R$ 0 pois é crédito)
      if (resumo?.original_service) {
        items.push({ 
          name: `${resumo.original_service.nome} (Crédito Assinatura)`, 
          quantity: 1, 
          unitPrice: 0, 
          price: 0, 
          type: 'service' 
        });
      }

      if (items.length === 0) {
        items.push({ name: 'Serviço (Crédito Assinatura)', price: 0, type: 'service' });
      }

      // Adicionar info da assinatura como item descritivo
      items.push({
        name: `📋 Plano: ${activeSubscription?.plan_name || 'Combo'}`,
        price: 0,
        type: 'service'
      });
      items.push({
        name: `🎫 Créditos restantes: ${creditsRemaining}/${activeSubscription?.credits_total || 4}`,
        price: 0,
        type: 'service'
      });
      if (nextBillingDate) {
        items.push({
          name: `📅 Vencimento: ${nextBillingDate}`,
          price: 0,
          type: 'service'
        });
      }

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType: 'service',
        items,
        total: 0,
        paymentMethod: 'Assinatura (Crédito)',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        barberName: appointment?.barbeiro?.nome,
        tipAmount: 0,
      });

      return result.success;
    } catch (error) {
      console.error('[SUBSCRIPTION] Erro ao enviar e-mail:', error);
      return false;
    }
  }, [client, resumo, appointment, activeSubscription]);

  // Handler após comprovante processado (assinatura)
  const handleSubscriptionReceiptComplete = useCallback(() => {
    // Navegar para tela de sucesso → avaliação (fluxo normal)
    navigate('/totem/payment-success', {
      state: {
        appointment,
        client,
        total: 0,
        paymentMethod: 'subscription_credit',
        isDirect: false,
        transactionData: null,
        selectedProducts: productCart,
        extraServices,
        resumo,
        emailAlreadySent: true,
        tipAmount: 0,
      }
    });
  }, [navigate, appointment, client, productCart, extraServices, resumo]);

  const handlePayment = (method: 'pix' | 'card') => {
    if (!resumo) return;
    setProcessing(true);

    const paymentState = {
      venda_id: vendaId,
      session_id: session.id,
      appointment,
      client,
      total: totalComGorjeta,
      tipAmount,
      resumo,
      extraServices,
      selectedProducts: productCart,
      comboDiscount: comboMatch?.savings || 0,
      comboName: comboMatch?.combo_nome || null,
    };

    // NAVEGAR IMEDIATAMENTE - não bloquear por update de venda
    if (method === 'pix') {
      navigate('/totem/payment-pix', { state: paymentState });
    } else {
      navigate('/totem/payment-card', { state: paymentState });
    }

    // Atualizar gorjeta/total em background (fire-and-forget)
    if (vendaId) {
      supabase
        .from('vendas')
        .update({
          gorjeta: tipAmount,
          valor_total: totalComGorjeta,
          forma_pagamento: method === 'pix' ? 'PIX' : 'CARTAO',
        })
        .eq('id', vendaId)
        .then(({ error }) => {
          if (error) console.warn('[Checkout] Erro ao atualizar venda em background:', error);
        });
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl text-urbana-light">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 sm:p-6 font-poppins relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <Button onClick={() => navigate('/totem/home')} variant="ghost" className="text-urbana-light hover:text-urbana-gold">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-urbana-light">Checkout</h1>
        <div className="w-24" />
      </div>

      {/* Content Grid */}
      <div className="flex-1 z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Barber Info Card */}
        {barber && (
          <Card className="p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 h-fit">
            <h2 className="text-base font-bold text-urbana-light mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-urbana-gold" />
              Seu Barbeiro
            </h2>

            <div className="flex items-center gap-4 p-3 bg-urbana-gold/10 backdrop-blur-sm rounded-xl border border-urbana-gold/30">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-urbana-gold flex-shrink-0">
                {barber.foto_url || barber.image_url ? (
                  <img src={barber.foto_url || barber.image_url} alt={barber.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-urbana-gold/20">
                    <User className="w-8 h-8 text-urbana-gold" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-urbana-light truncate">{barber.nome}</p>
                {barber.especialidade && (
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="w-4 h-4 text-urbana-gold flex-shrink-0" />
                    <p className="text-sm text-urbana-light/70 truncate">{barber.especialidade}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 overflow-hidden flex flex-col">
          <div className="text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-urbana-gold mx-auto mb-2" />
            <h2 className="text-xl font-bold text-urbana-light">Olá, {client?.nome?.split(' ')[0]}!</h2>
            <p className="text-urbana-light/70 text-sm">Finalize seu atendimento</p>
          </div>

          {/* Add items */}
          <Button
            onClick={() => setExtrasModalOpen(true)}
            className="mb-4 h-12 bg-urbana-gold/15 border-2 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar serviços / produtos
          </Button>

          {/* Service Summary - Nota Fiscal Style */}
          {resumo && (
            <div className="flex-1 overflow-y-auto mb-4">
              {/* Receipt Header */}
              <div className="bg-urbana-black/40 rounded-t-xl border-2 border-b-0 border-urbana-gold/30 p-3">
                <div className="text-center border-b border-dashed border-urbana-gold/30 pb-2 mb-2">
                  <p className="text-urbana-gold font-bold text-sm tracking-wider">COSTA URBANA BARBEARIA</p>
                  <p className="text-urbana-light/50 text-xs">CUPOM DE ATENDIMENTO</p>
                </div>
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-1 text-xs text-urbana-light/60 font-medium border-b border-urbana-gold/20 pb-2">
                  <div className="col-span-6">DESCRIÇÃO</div>
                  <div className="col-span-2 text-center">QTD</div>
                  <div className="col-span-2 text-right">UNIT</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-urbana-black/30 border-2 border-t-0 border-b-0 border-urbana-gold/30 divide-y divide-urbana-gold/10">
                {/* Main Service */}
                <div className="grid grid-cols-12 gap-1 p-3 items-center">
                  <div className="col-span-6 flex items-center gap-2">
                    <Package className="w-4 h-4 text-urbana-gold flex-shrink-0" />
                    <div>
                      <p className="text-urbana-light text-sm font-medium leading-tight">{resumo.original_service.nome}</p>
                      <p className="text-urbana-light/50 text-xs">Serviço Principal</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-urbana-light/80 text-sm">1</div>
                  <div className="col-span-2 text-right text-urbana-light/80 text-sm">R$ {resumo.original_service.preco.toFixed(2)}</div>
                  <div className="col-span-2 text-right text-urbana-gold font-bold text-sm">R$ {resumo.original_service.preco.toFixed(2)}</div>
                </div>

                {/* Extra Services */}
                {resumo.extra_services && resumo.extra_services.length > 0 &&
                  resumo.extra_services.map((extra, idx) => (
                    <div key={`extra-${idx}`} className="grid grid-cols-12 gap-1 p-3 items-center bg-emerald-500/5">
                      <div className="col-span-6 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-urbana-light text-sm font-medium leading-tight">{extra.nome}</p>
                          <p className="text-emerald-400/60 text-xs">Serviço Extra</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-urbana-light/80 text-sm">1</div>
                      <div className="col-span-2 text-right text-urbana-light/80 text-sm">R$ {extra.preco.toFixed(2)}</div>
                      <div className="col-span-2 text-right text-emerald-400 font-bold text-sm">R$ {extra.preco.toFixed(2)}</div>
                    </div>
                  ))}

                {/* Products */}
                {resumo.products && resumo.products.length > 0 &&
                  resumo.products.map((prod, idx) => (
                    <div key={`prod-${idx}`} className="grid grid-cols-12 gap-1 p-3 items-center bg-blue-500/5">
                      <div className="col-span-6 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-urbana-light text-sm font-medium leading-tight">{prod.nome}</p>
                          <p className="text-blue-400/60 text-xs">Produto</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-urbana-light/80 text-sm">{prod.quantidade}</div>
                      <div className="col-span-2 text-right text-urbana-light/80 text-sm">R$ {prod.preco.toFixed(2)}</div>
                      <div className="col-span-2 text-right text-blue-400 font-bold text-sm">R$ {(prod.preco * prod.quantidade).toFixed(2)}</div>
                    </div>
                  ))}
              </div>

              {/* Combo Discount & Subtotal & Tip */}
              <div className="bg-urbana-black/40 border-2 border-t-0 border-urbana-gold/30 rounded-b-xl p-3 space-y-2">
                {/* Combo Discount */}
                {comboMatch && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 text-sm font-bold">Combo detectado!</span>
                    </div>
                    <p className="text-xs text-emerald-300/80 mb-1">
                      {comboMatch.combo_nome} — preço do combo aplicado automaticamente
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-300/60">Desconto combo</span>
                      <span className="text-emerald-400 font-bold text-sm">- R$ {comboMatch.savings.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between items-center text-sm border-b border-dashed border-urbana-gold/20 pb-2">
                  <span className="text-urbana-light/70">SUBTOTAL</span>
                  <span className="text-urbana-light font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>

                {/* Tip Input */}
                <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-pink-300 text-sm font-medium">Gorjeta (opcional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-pink-300">R$</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={tipInput}
                      onChange={(e) => handleTipChange(e.target.value)}
                      className="flex-1 bg-urbana-black/50 border-pink-500/30 text-urbana-light text-right"
                    />
                  </div>
                  <p className="text-xs text-pink-300/60 mt-1">100% destinada ao seu barbeiro</p>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-urbana-gold/20 rounded-xl border-2 border-urbana-gold/50">
                  <span className="text-lg font-bold text-urbana-light">TOTAL A PAGAR</span>
                  <span className="text-2xl font-bold text-urbana-gold">R$ {totalComGorjeta.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 h-fit">
          <h3 className="text-base font-bold text-urbana-light mb-4 text-center">Forma de Pagamento</h3>

          {/* Subscription Credit Button */}
          {activeSubscription && activeSubscription.credits_remaining > 0 && isServiceCoveredByPlan && (
            <div className="mb-4">
              <Button
                onClick={handleUseCredit}
                disabled={processing}
                className="w-full h-20 bg-gradient-to-br from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white text-lg font-bold rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/30 border-2 border-purple-400/50"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6" />
                  <span>Usar 1 Crédito</span>
                </div>
                <span className="text-xs text-purple-200/80">
                  {activeSubscription.plan_name} • {activeSubscription.credits_remaining} crédito{activeSubscription.credits_remaining > 1 ? 's' : ''} restante{activeSubscription.credits_remaining > 1 ? 's' : ''}
                </span>
              </Button>
              <div className="mt-2 text-center">
                <p className="text-xs text-purple-300/60">R$ 0,00 — sem cobrança</p>
              </div>
              <div className="my-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-urbana-gold/20" />
                <span className="text-xs text-urbana-light/40">ou pague normalmente</span>
                <div className="flex-1 h-px bg-urbana-gold/20" />
              </div>
            </div>
          )}

          {/* Info: serviço não coberto pelo plano */}
          {activeSubscription && activeSubscription.credits_remaining > 0 && !isServiceCoveredByPlan && appointment?.servico_id && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-xs text-amber-300 text-center">
                ⚠️ Este serviço não está incluído no plano <strong>{activeSubscription.plan_name}</strong>. O pagamento será realizado normalmente.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handlePayment('pix')}
              disabled={processing}
              className="h-24 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-bold rounded-xl flex flex-col items-center justify-center gap-2"
            >
              <DollarSign className="w-8 h-8" />
              PIX
            </Button>
            <Button
              onClick={() => handlePayment('card')}
              disabled={processing}
              className="h-24 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-bold rounded-xl flex flex-col items-center justify-center gap-2"
            >
              <CreditCard className="w-8 h-8" />
              Cartão
            </Button>
          </div>

          {processing && (
            <div className="mt-4 text-center">
              <div className="w-8 h-8 border-2 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-2" />
              <p className="text-urbana-light text-sm">Processando...</p>
            </div>
          )}
        </Card>
      </div>

      <TotemCheckoutExtrasModal
        open={extrasModalOpen}
        onOpenChange={setExtrasModalOpen}
        mainServiceId={appointment?.servico_id || appointment?.servico?.id || null}
        initialExtraServices={extraServices}
        initialProducts={productCart}
        onApply={({ extraServices: nextExtras, products: nextProducts }) => {
          syncItemsAndReloadSummary(nextExtras, nextProducts);
        }}
      />

      {/* Modal de comprovante para checkout via crédito de assinatura */}
      <TotemReceiptOptionsModal
        isOpen={showReceiptModal}
        onClose={() => {}}
        onComplete={handleSubscriptionReceiptComplete}
        clientName={client?.nome || ''}
        clientEmail={client?.email}
        total={0}
        onSendEmail={handleSendSubscriptionReceiptEmail}
        isPrintAvailable={false}
      />
    </div>
  );
};

export default TotemCheckout;
