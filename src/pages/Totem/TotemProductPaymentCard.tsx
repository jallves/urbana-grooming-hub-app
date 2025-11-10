import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client, cardType } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(true);
  const [simulationTimer, setSimulationTimer] = useState(15); // 15 segundos para simulação
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!sale || !client) {
      navigate('/totem/home');
      return;
    }
    
    // Timer de simulação - aprova pagamento automaticamente após 15 segundos
    const interval = setInterval(() => {
      setSimulationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log('🤖 Simulação: Aprovando pagamento no cartão automaticamente...');
          toast.info('Simulação', {
            description: 'Pagamento no cartão aprovado automaticamente (simulação)'
          });
          handlePaymentSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sale, client, navigate]);

  const handlePaymentSuccess = async () => {
    try {
      console.log('✅ Pagamento no cartão aprovado! Finalizando venda...');
      
      // 1. Buscar itens da venda
      const { data: saleItems, error: itemsError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', sale.id)
        .eq('tipo', 'PRODUTO');

      if (itemsError) {
        console.error('Erro ao buscar itens:', itemsError);
        setError({
          title: 'Erro ao processar venda',
          message: 'Não foi possível buscar os itens da venda. Procure um atendente.'
        });
        return;
      }

      // 2. Atualizar estoque de cada produto
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          const { error: stockError } = await supabase.rpc('decrease_product_stock', {
            p_product_id: item.ref_id,
            p_quantity: item.quantidade
          });

          if (stockError) {
            console.error('Erro ao atualizar estoque:', stockError);
          }
        }
      }

      // 3. Preparar itens para o ERP (formato CheckoutItem)
      const erpItems = saleItems.map(item => ({
        type: 'product' as const,
        id: item.ref_id,
        name: item.nome,
        quantity: item.quantidade,
        price: Number(item.preco_unit),
        discount: 0
      }))

      console.log('💰 Integrando venda de produtos com ERP Financeiro...', {
        client_id: sale.cliente_id,
        items_count: erpItems.length,
        payment_method: cardType, // 'debit' ou 'credit'
        total: sale.total
      })

      // 4. Chamar edge function para criar registros financeiros (APENAS produtos, sem comissão)
      const { data: erpResult, error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            client_id: sale.cliente_id,
            items: erpItems,
            payment_method: cardType, // 'debit' ou 'credit'
            discount_amount: Number(sale.desconto) || 0,
            notes: `Venda de Produtos - Totem`
          }
        }
      )

      if (erpError) {
        console.error('❌ Erro ao integrar com ERP:', erpError)
        // Não bloquear finalização por erro no ERP, apenas logar
        console.log('⚠️ Continuando finalização sem integração ERP')
      } else {
        console.log('✅ ERP Financeiro integrado com sucesso (produtos):', erpResult)
      }

      // 5. Atualizar venda para PAGA
      const { error } = await supabase
        .from('vendas')
        .update({
          status: 'PAGA',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        setError({
          title: 'Erro ao finalizar pagamento',
          message: 'O pagamento foi aprovado, mas houve um erro ao finalizar a venda. Procure um atendente.'
        });
        return;
      }
      
      toast.success('Pagamento aprovado!');
      navigate('/totem/product-payment-success', { state: { sale, client } });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setError({
        title: 'Erro inesperado',
        message: 'Ocorreu um erro ao processar o pagamento. Por favor, procure um atendente.'
      });
      setIsProcessing(false);
    }
  };

  if (!sale) return null;

  if (error) {
    return (
      <TotemErrorFeedback
        title={error.title}
        message={error.message}
        onRetry={() => {
          setError(null);
          setIsProcessing(true);
          handlePaymentSuccess();
        }}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 font-poppins relative overflow-hidden">
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

      <Card className="relative w-full max-w-2xl p-8 space-y-8 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30 text-center z-10">
        
        {/* Indicador de Simulação */}
        <div className="bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/30 rounded-xl p-4 animate-pulse">
          <div className="flex items-center justify-center gap-2 text-urbana-gold">
            <div className="w-2 h-2 bg-urbana-gold rounded-full animate-ping" />
            <p className="text-base font-bold">
              🤖 SIMULAÇÃO: Pagamento será aprovado em {simulationTimer}s
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
            <CreditCard className="w-16 h-16 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold">
            Processando Pagamento
          </h1>
          
          <p className="text-xl text-urbana-gold/80 font-semibold">
            {cardType === 'debit' ? 'DÉBITO' : 'CRÉDITO'}
          </p>
          
          <p className="text-2xl font-black text-urbana-gold">
            R$ {sale.total.toFixed(2)}
          </p>
          
          <p className="text-lg text-urbana-light/70">
            Aproxime ou insira seu cartão na máquina
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
        </div>
      </Card>
    </div>
  );
};

export default TotemProductPaymentCard;
