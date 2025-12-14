import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { useToast } from '@/hooks/use-toast';

const TotemProductPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const emailSentRef = useRef(false);
  const { sale, client, transactionData } = location.state || {};

  useEffect(() => {
    if (!sale || !client) {
      navigate('/totem/home');
      return;
    }

    // Enviar comprovante por e-mail
    const sendEmailReceipt = async () => {
      if (emailSentRef.current) return;
      emailSentRef.current = true;

      // Usar o e-mail do cliente cadastrado
      const clientEmail = client?.email;
      if (!clientEmail) {
        console.log('[ProductPaymentSuccess] Cliente não tem e-mail cadastrado');
        return;
      }

      const items = sale.items?.map((item: any) => ({
        name: item.produto?.nome || item.name || 'Produto',
        quantity: item.quantidade || item.quantity || 1,
        price: (item.preco_unitario || item.price || 0) * (item.quantidade || item.quantity || 1)
      })) || [{ name: 'Produtos', price: sale.total }];

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: clientEmail,
        transactionType: 'product',
        items,
        total: sale.total,
        paymentMethod: transactionData?.paymentMethod || 'card',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: transactionData?.nsu
      });

      if (result.success) {
        toast({
          title: "Comprovante enviado!",
          description: `Enviamos para ${clientEmail}`,
        });
      }
    };

    sendEmailReceipt();

    const timer = setTimeout(() => {
      navigate('/totem/home');
    }, 8000);

    return () => clearTimeout(timer);
  }, [sale, client, navigate, transactionData, toast]);

  if (!sale || !client) return null;

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

      <div className="relative text-center space-y-6 max-w-2xl z-10">
        <div className="flex justify-center animate-scale-in">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400 to-green-500 blur-3xl opacity-50" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 md:w-20 md:h-20 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
            Compra Finalizada!
          </h1>
          
          <p className="text-xl md:text-2xl text-urbana-light">
            Obrigado, {client?.nome?.split(' ')[0]}!
          </p>

          <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-urbana-light/60">Data:</span>
              <span className="text-urbana-light">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
            </div>
            
            {transactionData?.nsu && (
              <div className="flex justify-between text-sm">
                <span className="text-urbana-light/60">NSU:</span>
                <span className="text-urbana-light">{transactionData.nsu}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-urbana-gold/30">
              <span className="text-lg font-bold text-urbana-light">TOTAL:</span>
              <span className="text-xl font-black text-urbana-gold">
                R$ {sale?.total?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate('/totem/home')}
          size="lg"
          className="h-14 px-8 text-lg bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold"
        >
          <Home className="w-5 h-5 mr-2" />
          Voltar ao Início
        </Button>
        
        <p className="text-base text-urbana-gold font-bold">
          Costa Urbana Barbearia ✂️
        </p>
      </div>
    </div>
  );
};

export default TotemProductPaymentSuccess;
