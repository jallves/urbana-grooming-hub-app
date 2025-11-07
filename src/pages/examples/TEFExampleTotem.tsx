/**
 * EXEMPLO DE INTEGRAÇÃO TEF NO TOTEM
 * 
 * Este arquivo demonstra como integrar o TEF em uma tela de checkout do Totem.
 * 
 * IMPORTANTE: Este é apenas um exemplo. Você deve adaptar para seu fluxo real.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, DollarSign } from 'lucide-react';
import TEFPaymentModal from '@/components/totem/TEFPaymentModal';
import { toast } from 'sonner';

// Exemplo de dados do pedido
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const TEFExampleTotem: React.FC = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [installments, setInstallments] = useState(1);

  // Exemplo de itens do pedido
  const orderItems: OrderItem[] = [
    { id: '1', name: 'Corte Masculino', price: 3500, quantity: 1 },
    { id: '2', name: 'Barba', price: 2000, quantity: 1 },
  ];

  // Calcular total
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const handlePaymentSuccess = async (paymentId: string, authCode: string) => {
    console.log('✅ Pagamento aprovado!', { paymentId, authCode });
    
    toast.success('Pagamento aprovado!', {
      description: `Código: ${authCode}`
    });

    // AQUI VOCÊ DEVE:
    // 1. Marcar agendamento como concluído
    // 2. Registrar no fluxo de caixa (financial_records)
    // 3. Registrar comissão do barbeiro
    // 4. Gerar recibo
    // 5. Enviar notificação ao cliente (opcional)
    
    // Exemplo:
    // await supabase.from('painel_agendamentos')
    //   .update({ status: 'concluido', payment_id: paymentId })
    //   .eq('id', agendamentoId);

    // Fechar modal
    setShowPayment(false);
    
    // Redirecionar para tela de sucesso
    // navigate('/totem/success');
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Erro no pagamento:', error);
    
    toast.error('Pagamento não aprovado', {
      description: error
    });

    // AQUI VOCÊ PODE:
    // 1. Permitir tentar novamente
    // 2. Oferecer outro método de pagamento
    // 3. Voltar para tela anterior
    
    setShowPayment(false);
  };

  const initiatePayment = (type: 'credit' | 'debit' | 'pix') => {
    setPaymentType(type);
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">Checkout - Totem</h1>
          <p className="text-gray-600 mt-2">Exemplo de integração TEF</p>
        </div>

        {/* Resumo do Pedido */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-black">{item.name}</p>
                  <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                </div>
                <p className="font-semibold text-black">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-black">Total</p>
                <p className="text-2xl font-bold text-black">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Selecione a forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Crédito */}
            <Button
              onClick={() => initiatePayment('credit')}
              className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white text-lg"
              size="lg"
            >
              <CreditCard className="h-6 w-6 mr-3" />
              <div className="text-left">
                <p className="font-bold">Cartão de Crédito</p>
                <p className="text-sm opacity-90">Em até 12x</p>
              </div>
            </Button>

            {/* Débito */}
            <Button
              onClick={() => initiatePayment('debit')}
              className="w-full h-20 bg-green-600 hover:bg-green-700 text-white text-lg"
              size="lg"
            >
              <DollarSign className="h-6 w-6 mr-3" />
              <div className="text-left">
                <p className="font-bold">Cartão de Débito</p>
                <p className="text-sm opacity-90">À vista</p>
              </div>
            </Button>

            {/* PIX */}
            <Button
              onClick={() => initiatePayment('pix')}
              className="w-full h-20 bg-teal-600 hover:bg-teal-700 text-white text-lg"
              size="lg"
            >
              <Smartphone className="h-6 w-6 mr-3" />
              <div className="text-left">
                <p className="font-bold">PIX</p>
                <p className="text-sm opacity-90">Aprovação instantânea</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Este é um exemplo de integração. 
              Para usar em produção, adapte o código conforme necessário e 
              configure as credenciais reais da PayGo em Configurações TEF.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Pagamento TEF */}
      <TEFPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={totalAmount}
        paymentType={paymentType}
        installments={installments}
        reference={`totem_example_${Date.now()}`}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};

export default TEFExampleTotem;