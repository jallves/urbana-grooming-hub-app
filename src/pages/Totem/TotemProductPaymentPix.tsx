import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(true);
  const [simulationTimer, setSimulationTimer] = useState(15); // 15 segundos para simulação

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
          console.log('🤖 Simulação: Aprovando pagamento PIX automaticamente...');
          toast.info('Simulação', {
            description: 'Pagamento PIX aprovado automaticamente (simulação)'
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
      console.log('✅ Pagamento PIX confirmado! Finalizando venda...');
      
      // 🔒 CORREÇÃO: Buscar itens da venda usando vendas_itens
      const { data: saleItems, error: itemsError } = await supabase
        .from('vendas_itens')
        .select('ref_id, quantidade')
        .eq('venda_id', sale.id)
        .eq('tipo', 'PRODUTO');

      if (itemsError) throw itemsError;

      // Atualizar estoque de cada produto
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          const { error: stockError } = await supabase.rpc('decrease_product_stock', {
            p_product_id: item.ref_id,
            p_quantity: item.quantidade
          });

          if (stockError) {
            console.error('Erro ao atualizar estoque:', stockError);
            // Continua mesmo com erro de estoque
          }
        }
      }

      // 🔒 CORREÇÃO: Atualizar status usando tabela 'vendas'
      const { error } = await supabase
        .from('vendas')
        .update({
          status: 'PAGA',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) throw error;
      
      toast.success('Pagamento aprovado!');
      navigate('/totem/product-payment-success', { state: { sale, client } });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
      setIsProcessing(false);
    }
  };

  if (!sale) return null;

  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${sale.pix_key || '31996857008'}52040000530398654${sale.total.toFixed(2)}5802BR5925COSTA URBANA BARBEARIA6014BELO HORIZONTE62070503***6304${sale.transaction_id}`;

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

      <Card className="relative w-full max-w-2xl p-6 sm:p-8 space-y-6 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30 z-10">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold">
          Pagamento via PIX
        </h1>

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
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG value={pixPayload} size={256} />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-2xl font-black text-urbana-gold">
            R$ {sale.total.toFixed(2)}
          </p>
          <p className="text-urbana-light/60">
            Escaneie o QR Code para pagar
          </p>
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <div className="w-3 h-3 rounded-full bg-urbana-gold animate-pulse" />
              <p className="text-urbana-light">Aguardando pagamento...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TotemProductPaymentPix;
