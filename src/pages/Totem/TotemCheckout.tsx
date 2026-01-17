import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle2, User, Award, Heart, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

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

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Receber extras do TotemUpsell
  const { 
    appointment, 
    client, 
    session, 
    extraServices: stateExtraServices = [], 
    productCart: stateProductCart = [] 
  } = location.state || {};
  
  const [resumo, setResumo] = useState<CheckoutSummary | null>(null);
  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipInput, setTipInput] = useState<string>('');
  const [vendaId, setVendaId] = useState<string | null>(null);

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
  }, [appointment, session]);

  const loadCheckout = async () => {
    setLoading(true);
    try {
      // Buscar dados do barbeiro
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
              : barberData.specialties
          });
        }
      }

      console.log('📦 Extras do state:', {
        extraServices: stateExtraServices.length,
        products: stateProductCart.length
      });

      // Iniciar checkout via edge function para criar venda
      // Passar extras para a edge function processar
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'totem-checkout',
        {
          body: {
            action: 'start',
            agendamento_id: appointment.id,
            session_id: session.id,
            extras: stateExtraServices.map((s: any) => ({
              id: s.id,
              nome: s.nome,
              preco: s.preco,
              tipo: 'SERVICO_EXTRA'
            })),
            products: stateProductCart.map((p: any) => ({
              id: p.id,
              nome: p.nome,
              preco: p.preco,
              quantidade: p.quantidade
            }))
          }
        }
      );

      if (checkoutError) {
        console.error('Erro ao iniciar checkout:', checkoutError);
        toast.error('Erro ao iniciar checkout');
        
        // Fallback: Build summary from appointment data + state extras
        const serviceName = appointment?.servico?.nome || 'Serviço';
        const servicePrice = Number(appointment?.servico?.preco) || 0;
        
        const extraServicesTotal = stateExtraServices.reduce((sum: number, s: any) => sum + s.preco, 0);
        const productsTotal = stateProductCart.reduce((sum: number, p: any) => sum + (p.preco * p.quantidade), 0);
        const totalFallback = servicePrice + extraServicesTotal + productsTotal;

        setResumo({
          original_service: {
            nome: serviceName,
            preco: servicePrice
          },
          extra_services: stateExtraServices.map((s: any) => ({
            nome: s.nome,
            preco: s.preco
          })),
          products: stateProductCart.map((p: any) => ({
            nome: p.nome,
            preco: p.preco,
            quantidade: p.quantidade
          })),
          subtotal: totalFallback,
          discount: 0,
          total: totalFallback
        });
      } else {
        console.log('✅ Checkout iniciado:', checkoutData);
        setVendaId(checkoutData.venda_id);
        setResumo(checkoutData.resumo);
      }
    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleTipChange = (value: string) => {
    // Remove tudo que não for número ou vírgula
    const cleanValue = value.replace(/[^\d,]/g, '');
    setTipInput(cleanValue);
    
    // Converter para número
    const numericValue = parseFloat(cleanValue.replace(',', '.')) || 0;
    setTipAmount(numericValue);
  };

  const handlePayment = async (method: 'pix' | 'card') => {
    if (!resumo) return;
    
    setProcessing(true);
    
    try {
      const totalComGorjeta = resumo.total + tipAmount;

      // Se não temos venda_id (fallback), criar venda diretamente
      if (!vendaId) {
        const { data: venda, error: vendaError } = await supabase
          .from('vendas')
          .insert({
            cliente_id: client?.id,
            barbeiro_id: appointment?.barbeiro_id,
            valor_total: totalComGorjeta,
            gorjeta: tipAmount,
            forma_pagamento: method === 'pix' ? 'PIX' : 'CARTAO',
            status: 'ABERTA'
          })
          .select()
          .single();

        if (vendaError) throw vendaError;

        // Create vendas_itens record para serviço principal
        await supabase
          .from('vendas_itens')
          .insert({
            venda_id: venda.id,
            item_id: appointment?.servico_id || appointment?.servico?.id,
            tipo: 'SERVICO',
            nome: resumo.original_service.nome,
            preco_unitario: resumo.original_service.preco,
            quantidade: 1,
            subtotal: resumo.original_service.preco,
            barbeiro_id: appointment?.barbeiro_id
          });

        // Criar itens para serviços extras
        if (resumo.extra_services && resumo.extra_services.length > 0) {
          for (const extra of stateExtraServices) {
            await supabase
              .from('vendas_itens')
              .insert({
                venda_id: venda.id,
                item_id: extra.id,
                tipo: 'SERVICO_EXTRA',
                nome: extra.nome,
                preco_unitario: extra.preco,
                quantidade: 1,
                subtotal: extra.preco,
                barbeiro_id: appointment?.barbeiro_id
              });
          }
        }

        // Criar itens para produtos
        if (resumo.products && resumo.products.length > 0) {
          for (const prod of stateProductCart) {
            await supabase
              .from('vendas_itens')
              .insert({
                venda_id: venda.id,
                item_id: prod.id,
                tipo: 'PRODUTO',
                nome: prod.nome,
                preco_unitario: prod.preco,
                quantidade: prod.quantidade,
                subtotal: prod.preco * prod.quantidade,
                barbeiro_id: appointment?.barbeiro_id
              });
          }
        }

        // Navegar para pagamento - USAR /totem/payment-card que chama PayGo
        const paymentState = {
          venda_id: venda.id,
          session_id: session.id,
          appointment,
          client,
          total: totalComGorjeta,
          tipAmount,
          resumo,
          extraServices: stateExtraServices,
          selectedProducts: stateProductCart
        };

        if (method === 'pix') {
          navigate('/totem/payment-pix', { state: paymentState });
        } else {
          navigate('/totem/payment-card', { state: paymentState });
        }
      } else {
        // Atualizar venda com gorjeta
        if (tipAmount > 0) {
          await supabase
            .from('vendas')
            .update({ 
              gorjeta: tipAmount,
              valor_total: totalComGorjeta
            })
            .eq('id', vendaId);
        }

        // Navegar para pagamento - USAR /totem/payment-card que chama PayGo
        const paymentState = {
          venda_id: vendaId,
          session_id: session.id,
          appointment,
          client,
          total: totalComGorjeta,
          tipAmount,
          resumo,
          extraServices: stateExtraServices,
          selectedProducts: stateProductCart
        };

        if (method === 'pix') {
          navigate('/totem/payment-pix', { state: paymentState });
        } else {
          navigate('/totem/payment-card', { state: paymentState });
        }
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

  const totalComGorjeta = (resumo?.total || 0) + tipAmount;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 sm:p-6 font-poppins relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          className="text-urbana-light hover:text-urbana-gold"
        >
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
                  <img 
                    src={barber.foto_url || barber.image_url} 
                    alt={barber.nome}
                    className="w-full h-full object-cover"
                  />
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
            <h2 className="text-xl font-bold text-urbana-light">
              Olá, {client?.nome?.split(' ')[0]}!
            </h2>
            <p className="text-urbana-light/70 text-sm">Finalize seu atendimento</p>
          </div>

          {/* Service Summary */}
          {resumo && (
            <div className="space-y-2 mb-4 flex-1 overflow-y-auto">
              {/* Main Service */}
              <div className="flex justify-between items-center p-3 bg-urbana-black/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-urbana-gold" />
                  <span className="text-urbana-light text-sm">{resumo.original_service.nome}</span>
                </div>
                <span className="text-urbana-gold font-bold">
                  R$ {resumo.original_service.preco.toFixed(2)}
                </span>
              </div>

              {/* Extra Services */}
              {resumo.extra_services && resumo.extra_services.length > 0 && (
                resumo.extra_services.map((extra, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-urbana-black/20 rounded-xl">
                    <span className="text-urbana-light/80 text-sm">+ {extra.nome}</span>
                    <span className="text-urbana-gold/80">
                      R$ {extra.preco.toFixed(2)}
                    </span>
                  </div>
                ))
              )}

              {/* Products */}
              {resumo.products && resumo.products.length > 0 && (
                resumo.products.map((prod, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-urbana-black/20 rounded-xl">
                    <span className="text-urbana-light/80 text-sm">{prod.quantidade}x {prod.nome}</span>
                    <span className="text-urbana-gold/80">
                      R$ {(prod.preco * prod.quantidade).toFixed(2)}
                    </span>
                  </div>
                ))
              )}

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
                    placeholder="0,00"
                    value={tipInput}
                    onChange={(e) => handleTipChange(e.target.value)}
                    className="flex-1 bg-urbana-black/50 border-pink-500/30 text-urbana-light text-right"
                  />
                </div>
                <p className="text-xs text-pink-300/60 mt-1">100% destinada ao seu barbeiro</p>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-urbana-gold/20 rounded-xl border-2 border-urbana-gold/50 mt-2">
                <span className="text-lg font-bold text-urbana-light">TOTAL</span>
                <span className="text-2xl font-bold text-urbana-gold">
                  R$ {totalComGorjeta.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 h-fit">
          <h3 className="text-base font-bold text-urbana-light mb-4 text-center">
            Forma de Pagamento
          </h3>

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
    </div>
  );
};

export default TotemCheckout;
