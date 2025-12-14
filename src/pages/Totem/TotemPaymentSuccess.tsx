import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Receipt, Star, Mail } from 'lucide-react';
import { format } from 'date-fns';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { useToast } from '@/hooks/use-toast';

interface ExtraService {
  service_id?: string;
  nome: string;
  preco: number;
}

interface SelectedProduct {
  product_id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface CheckoutResumo {
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

const TotemPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const emailSentRef = useRef(false);
  const { 
    appointment, 
    client, 
    total, 
    paymentMethod, 
    isDirect, 
    transactionData,
    selectedProducts = [] as SelectedProduct[],
    extraServices = [] as ExtraService[],
    resumo
  } = location.state || {};

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    console.log('[PaymentSuccess] Dados recebidos:', { 
      appointment, client, total, paymentMethod, isDirect, transactionData,
      selectedProducts, extraServices, resumo
    });
    
    if (!total || !client) {
      console.warn('[PaymentSuccess] Dados incompletos, redirecionando...');
      navigate('/totem/home');
      return;
    }

    // Enviar comprovante por e-mail com todos os itens
    const sendEmailReceipt = async () => {
      if (emailSentRef.current) return;
      emailSentRef.current = true;

      // Usar o e-mail do cliente cadastrado
      const clientEmail = client?.email;
      if (!clientEmail) {
        console.log('[PaymentSuccess] Cliente não tem e-mail cadastrado');
        return;
      }

      // Montar lista completa de itens para o e-mail com tipo explícito
      const items: Array<{ name: string; quantity?: number; price: number; type: 'service' | 'product' }> = [];

      // 1. Serviço principal
      if (resumo?.original_service) {
        items.push({
          name: resumo.original_service.nome,
          price: resumo.original_service.preco,
          type: 'service'
        });
      } else if (appointment?.servico) {
        items.push({
          name: appointment.servico.nome,
          price: appointment.servico.preco || 0,
          type: 'service'
        });
      }

      // 2. Serviços extras
      if (resumo?.extra_services && resumo.extra_services.length > 0) {
        resumo.extra_services.forEach((service: { nome: string; preco: number }) => {
          items.push({
            name: service.nome,
            price: service.preco,
            type: 'service'
          });
        });
      } else if (extraServices && extraServices.length > 0) {
        extraServices.forEach((service: ExtraService) => {
          items.push({
            name: service.nome,
            price: service.preco,
            type: 'service'
          });
        });
      }

      // 3. Produtos
      if (selectedProducts && selectedProducts.length > 0) {
        selectedProducts.forEach((product: SelectedProduct) => {
          items.push({
            name: product.nome,
            quantity: product.quantidade,
            price: product.preco * product.quantidade,
            type: 'product'
          });
        });
      }

      // Se não conseguiu montar itens, usar fallback
      if (items.length === 0) {
        items.push({ name: 'Serviço', price: total, type: 'service' });
      }

      // Determinar o tipo de transação
      const hasServices = items.some(item => item.type === 'service');
      const hasProducts = items.some(item => item.type === 'product');
      let transactionType: 'service' | 'product' | 'mixed' = 'service';
      if (hasServices && hasProducts) {
        transactionType = 'mixed';
      } else if (hasProducts) {
        transactionType = 'product';
      }

      console.log('[PaymentSuccess] Itens para e-mail:', items);
      console.log('[PaymentSuccess] Tipo de transação:', transactionType);

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: clientEmail,
        transactionType,
        items,
        total,
        paymentMethod: paymentMethod || 'card',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: transactionData?.nsu,
        barberName: appointment?.barbeiro?.nome
      });

      if (result.success) {
        toast({
          title: "Comprovante enviado!",
          description: `Enviamos para ${clientEmail}`,
        });
      }
    };

    sendEmailReceipt();

    // Para checkout de serviço: ir direto para avaliação após 3 segundos
    // Para venda direta de produtos: voltar para home após 5 segundos
    const timer = setTimeout(() => {
      if (isDirect) {
        navigate('/totem/home');
      } else if (appointment) {
        navigate('/totem/rating', {
          state: { appointment, client }
        });
      } else {
        navigate('/totem/home');
      }
    }, isDirect ? 5000 : 3000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, appointment, client, total, isDirect, paymentMethod, transactionData, toast, selectedProducts, extraServices, resumo]);

  if (!total || !client) {
    return null;
  }

  const getPaymentMethodText = () => {
    if (paymentMethod === 'credit') return 'Cartão de Crédito';
    if (paymentMethod === 'debit') return 'Cartão de Débito';
    return 'PIX';
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-brown/70 to-urbana-black/80" />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/20 via-urbana-brown/10 to-urbana-black/20 z-0" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: '1s' }} />

      <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-xl sm:max-w-2xl md:max-w-4xl w-full z-10 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-green-400/20">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message with Client Name */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300">
            Obrigado, {client.nome?.split(' ')[0]}! 🎉
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-urbana-light/90 font-semibold">
            Pagamento Confirmado!
          </p>
          
          {transactionData?.nsu && (
            <p className="text-sm text-urbana-light/60">
              NSU: {transactionData.nsu}
            </p>
          )}
        </div>

        {/* Receipt - Compacto */}
        <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-urbana-gold border-b border-urbana-gold/30 pb-2">
            <Receipt className="w-4 h-4" />
            RECIBO
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-urbana-light/60">Data:</span>
              <span className="text-urbana-light">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
            </div>
            
            {appointment?.servico?.nome && (
              <div className="flex justify-between">
                <span className="text-urbana-light/60">Serviço:</span>
                <span className="text-urbana-light">{appointment.servico.nome}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-urbana-light/60">Pagamento:</span>
              <span className="text-urbana-light">{getPaymentMethodText()}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-urbana-gold/30">
              <span className="text-lg font-bold text-urbana-light">TOTAL:</span>
              <span className="text-xl font-black text-urbana-gold">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Indicador de próxima etapa */}
        <div className="flex items-center justify-center gap-2 text-urbana-gold/80 pt-2">
          <Star className="w-5 h-5 animate-pulse" />
          <span className="text-base sm:text-lg">
            {isDirect ? 'Voltando ao início...' : 'Preparando avaliação...'}
          </span>
        </div>

        {/* Footer */}
        <p className="text-base sm:text-lg text-urbana-gold font-bold pt-2">
          Costa Urbana Barbearia ✂️
        </p>
      </div>
    </div>
  );
};

export default TotemPaymentSuccess;
