import React, { useEffect, useRef, useState } from 'react';
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent' | 'no-email' | 'error'>('sending');

  // CRÍTICO: Armazenar state em refs para evitar perda em re-renders
  const stateRef = useRef(location.state);
  if (location.state && !stateRef.current) {
    stateRef.current = location.state;
  }

  const { sale: saleFromState, client, transactionData } = stateRef.current || {};
  
  // Garantir que sale tenha campo total para compatibilidade
  const sale = saleFromState ? { 
    ...saleFromState, 
    total: saleFromState.total || saleFromState.valor_total || 0 
  } : null;

  // Flag para verificar se temos dados válidos
  const hasValidData = !!(sale && client);

  // Redirecionar se não houver dados - mas APENAS uma vez
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasValidData && !redirectedRef.current) {
      redirectedRef.current = true;
      console.warn('[ProductPaymentSuccess] Dados incompletos, redirecionando...');
      navigate('/totem/home');
      return;
    }

    if (!hasValidData) return;

    // Enviar comprovante por e-mail
    const sendEmailReceipt = async () => {
      if (emailSentRef.current) return;
      emailSentRef.current = true;

      const clientEmail = client?.email;
      if (!clientEmail) {
        console.log('[ProductPaymentSuccess] Cliente não tem e-mail cadastrado');
        setEmailStatus('no-email');
        return;
      }

      const items: Array<{ name: string; quantity: number; unitPrice: number; price: number; type: 'service' | 'product' }> = [];
      
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item: any) => {
          const productName = item.nome || item.name || 'Produto';
          const quantity = Number(item.quantidade) || Number(item.quantity) || 1;
          const unitPrice = Number(item.preco_unitario) || Number(item.unitPrice) || 0;
          const itemSubtotal = Number(item.subtotal) || Number(item.price) || (unitPrice * quantity);
          
          items.push({
            name: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            price: itemSubtotal,
            type: 'product' as const
          });
        });
      } else {
        items.push({ 
          name: 'Compra de Produtos', 
          quantity: 1,
          unitPrice: sale.total,
          price: sale.total, 
          type: 'product' as const 
        });
      }

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
        setEmailStatus('sent');
        toast({
          title: "Comprovante enviado!",
          description: `Enviamos para ${clientEmail}`,
        });
      } else {
        setEmailStatus('error');
      }
    };

    sendEmailReceipt();

    // Timer para voltar ao início - usar ref para cleanup seguro
    timerRef.current = setTimeout(() => {
      navigate('/totem/home');
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CRÍTICO: Array vazio - executar apenas UMA VEZ

  if (!hasValidData) return null;

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

          {/* Status do e-mail */}
          {emailStatus === 'sent' && client?.email && (
            <p className="text-sm text-emerald-400">
              ✉️ Comprovante enviado para {client.email}
            </p>
          )}
          {emailStatus === 'sending' && client?.email && (
            <p className="text-sm text-urbana-light/60 animate-pulse">
              ✉️ Enviando comprovante para {client.email}...
            </p>
          )}

          <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-xl p-4 space-y-2 max-h-[40vh] overflow-y-auto">
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
            
            {/* Lista detalhada de produtos */}
            {sale?.items && sale.items.length > 0 && (
              <div className="py-2 border-t border-b border-urbana-gold/20 space-y-1">
                <p className="text-xs text-urbana-light/60 mb-1">Produtos:</p>
                {sale.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-urbana-light truncate max-w-[60%]">
                      {item.quantidade || 1}x {item.nome}
                    </span>
                    <span className="text-urbana-gold font-medium">
                      R$ {Number(item.subtotal || (item.preco_unitario * (item.quantidade || 1))).toFixed(2)}
                    </span>
                  </div>
                ))}
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
