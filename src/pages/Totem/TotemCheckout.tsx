import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface CheckoutSummary {
  original_service: {
    nome: string;
    preco: number;
  };
  total: number;
}

const TotemCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client, session } = location.state || {};
  const [resumo, setResumo] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
      // Build summary from appointment data
      const serviceName = appointment?.servico?.nome || 'Serviço';
      const servicePrice = Number(appointment?.servico?.preco) || 0;

      setResumo({
        original_service: {
          nome: serviceName,
          preco: servicePrice
        },
        total: servicePrice
      });
    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method: 'pix' | 'card') => {
    if (!resumo) return;
    
    setProcessing(true);
    
    try {
      // Create venda record
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: client?.id,
          barbeiro_id: appointment?.barbeiro_id,
          valor_total: resumo.total,
          forma_pagamento: method === 'pix' ? 'PIX' : 'CARTAO',
          status: 'pago'
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Create vendas_itens record
      await supabase
        .from('vendas_itens')
        .insert({
          venda_id: venda.id,
          item_id: appointment?.servico_id || appointment?.servico?.id,
          tipo: 'SERVICO',
          nome: resumo.original_service.nome,
          preco_unitario: resumo.original_service.preco,
          quantidade: 1,
          subtotal: resumo.original_service.preco
        });

      // Update appointment status
      await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'concluido',
          venda_id: venda.id 
        })
        .eq('id', appointment.id);

      toast.success('Pagamento realizado com sucesso!');
      
      navigate('/totem/success', {
        state: {
          message: 'Pagamento realizado com sucesso!',
          total: resumo.total
        }
      });
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
      <div className="flex items-center justify-between mb-6 z-10">
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

      {/* Content */}
      <div className="flex-1 z-10 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <Card className="w-full p-6 sm:p-8 bg-white/10 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-urbana-gold mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-urbana-light mb-2">
              Olá, {client?.nome?.split(' ')[0]}!
            </h2>
            <p className="text-urbana-light/70">Finalize seu atendimento</p>
          </div>

          {/* Service Summary */}
          {resumo && (
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-urbana-black/30 rounded-xl">
                <span className="text-urbana-light">{resumo.original_service.nome}</span>
                <span className="text-urbana-gold font-bold">
                  R$ {resumo.original_service.preco.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-urbana-gold/20 rounded-xl border-2 border-urbana-gold/50">
                <span className="text-xl font-bold text-urbana-light">Total</span>
                <span className="text-2xl font-bold text-urbana-gold">
                  R$ {resumo.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handlePayment('pix')}
              disabled={processing}
              className="h-20 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl"
            >
              <DollarSign className="w-6 h-6 mr-2" />
              PIX
            </Button>
            <Button
              onClick={() => handlePayment('card')}
              disabled={processing}
              className="h-20 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl"
            >
              <CreditCard className="w-6 h-6 mr-2" />
              Cartão
            </Button>
          </div>

          {processing && (
            <div className="mt-6 text-center">
              <div className="w-8 h-8 border-2 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-2" />
              <p className="text-urbana-light">Processando pagamento...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemCheckout;
