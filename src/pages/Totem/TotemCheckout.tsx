import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle2, User, Award, Heart, Package, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';
import TotemCheckoutExtrasModal, {
  CheckoutExtraService,
  CheckoutProductCartItem
} from '@/components/totem/TotemCheckoutExtrasModal';

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

function formatTipInputFromDigits(digits: string): { formatted: string; amount: number } {
  const onlyDigits = (digits || '').replace(/\D/g, '').slice(0, 9);
  const value = (parseInt(onlyDigits || '0', 10) / 100) || 0;
  const formatted = value.toFixed(2).replace('.', ',');
  return { formatted, amount: value };
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { appointment, client, session } = location.state || {};

  // Itens editáveis no CHECKOUT (como era antigamente)
  const [extraServices, setExtraServices] = useState<CheckoutExtraService[]>(location.state?.extraServices || []);
  const [productCart, setProductCart] = useState<CheckoutProductCartItem[]>(location.state?.productCart || []);
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);

  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipInput, setTipInput] = useState<string>('0,00');
  const [vendaId, setVendaId] = useState<string | null>(null);

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

  const subtotal = useMemo(
    () => originalService.preco + extraServicesTotal + productsTotal,
    [originalService.preco, extraServicesTotal, productsTotal]
  );

  const totalComGorjeta = useMemo(() => subtotal + tipAmount, [subtotal, tipAmount]);

  // Resumo local sempre atualizado automaticamente
  const resumo: CheckoutSummary = useMemo(() => ({
    original_service: originalService,
    extra_services: extraServices.map((s) => ({ nome: s.nome, preco: s.preco })),
    products: productCart.map((p) => ({ nome: p.nome, preco: p.preco, quantidade: p.quantidade })),
    subtotal,
    discount: 0,
    total: subtotal,
  }), [originalService, extraServices, productCart, subtotal]);

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
      // Barbeiro via agendamento
      if (appointment?.barbeiro_id) {
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('id, nome, foto_url, image_url, specialties')
          .eq('id', appointment.barbeiro_id)
          .single();

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

      // Iniciar/atualizar checkout via edge function (idempotente)
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'start',
          agendamento_id: appointment.id,
          session_id: session.id,
          extras: extraServices.map((s) => ({
            id: s.id,
            nome: s.nome,
            preco: s.preco,
            tipo: 'SERVICO_EXTRA',
          })),
          products: productCart.map((p) => ({
            id: p.id,
            nome: p.nome,
            preco: p.preco,
            quantidade: p.quantidade,
          })),
        },
      });

      if (checkoutError) {
        console.error('Erro ao iniciar checkout:', checkoutError);
        toast.error('Erro ao iniciar checkout');
        // fallback: usa o cálculo local (resumo já é useMemo)
      } else {
        setVendaId(checkoutData.venda_id);
        // Sincronizar estado local com dados do servidor se necessário
        // (já estão no useMemo, mas garantir venda_id foi setado)
      }
    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleTipChange = (value: string) => {
    // Máscara simples em centavos: 1 -> 0,01 | 1234 -> 12,34
    const digits = value.replace(/\D/g, '');
    const { formatted, amount } = formatTipInputFromDigits(digits);
    setTipInput(formatted);
    setTipAmount(amount);
  };

  const syncItemsAndReloadSummary = async (nextExtras: CheckoutExtraService[], nextProducts: CheckoutProductCartItem[]) => {
    // Atualiza estados locais IMEDIATAMENTE (total recalcula automático via useMemo)
    setExtraServices(nextExtras);
    setProductCart(nextProducts);

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
        setVendaId(data.venda_id);
      }
    } catch (e) {
      console.error('[TotemCheckout] Erro ao sincronizar itens:', e);
      // Não bloqueia UI - cálculo local já está correto
    }
  };

  const handlePayment = async (method: 'pix' | 'card') => {
    if (!resumo) return;
    setProcessing(true);

    try {
      // Atualizar gorjeta / total na venda se já existir
      if (vendaId) {
        await supabase
          .from('vendas')
          .update({
            gorjeta: tipAmount,
            valor_total: totalComGorjeta,
            forma_pagamento: method === 'pix' ? 'PIX' : 'CARTAO',
          })
          .eq('id', vendaId);
      }

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
      };

      if (method === 'pix') {
        navigate('/totem/payment-pix', { state: paymentState });
      } else {
        navigate('/totem/payment-card', { state: paymentState });
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
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

              {/* Subtotal & Tip */}
              <div className="bg-urbana-black/40 border-2 border-t-0 border-urbana-gold/30 rounded-b-xl p-3 space-y-2">
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
    </div>
  );
};

export default TotemCheckout;
