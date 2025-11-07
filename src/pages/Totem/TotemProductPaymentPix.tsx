import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const TotemProductPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client } = location.state || {};
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!sale || !client) {
      navigate('/totem/home');
    }
  }, []);

  const simulatePayment = async () => {
    setIsSimulating(true);
    
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('totem_product_sales')
          .update({
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', sale.id);

        if (error) throw error;
        
        toast.success('Pagamento confirmado!');
        navigate('/totem/product-payment-success', { state: { sale, client } });
      } catch (error) {
        toast.error('Erro ao confirmar pagamento');
        setIsSimulating(false);
      }
    }, 2000);
  };

  if (!sale) return null;

  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${sale.pix_key || '31996857008'}52040000530398654${sale.total.toFixed(2)}5802BR5925COSTA URBANA BARBEARIA6014BELO HORIZONTE62070503***6304${sale.transaction_id}`;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black flex items-center justify-center p-4 font-poppins">
      <Card className="w-full max-w-2xl p-6 sm:p-8 space-y-6 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold">
          Pagamento via PIX
        </h1>

        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG value={pixPayload} size={256} />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-2xl font-black text-urbana-gold">
            R$ {sale.total.toFixed(2)}
          </p>
          <p className="text-urbana-light/60">
            Escaneie o QR Code para pagar
          </p>
        </div>

        <Button
          onClick={simulatePayment}
          disabled={isSimulating}
          className="w-full h-16 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-xl"
        >
          {isSimulating ? 'Processando...' : 'Simular Pagamento (DEMO)'}
        </Button>
      </Card>
    </div>
  );
};

export default TotemProductPaymentPix;
