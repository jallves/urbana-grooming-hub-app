import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CreateTransactionRequest, CheckoutItem } from '@/types/erp';

export function useFinancialTransaction() {
  const [loading, setLoading] = useState(false);

  const createTransaction = async (data: CreateTransactionRequest) => {
    setLoading(true);
    try {
      console.log('💰 Criando transação financeira:', data);

      const { data: result, error } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: data
        }
      );

      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao criar transação');
      }

      console.log('✅ Transação criada:', result.data);

      toast.success('Transação criada com sucesso!', {
        description: `Número: ${result.data.transaction_number}`
      });

      return result.data;

    } catch (error: any) {
      console.error('❌ Erro ao criar transação:', error);
      toast.error('Erro ao criar transação', {
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createAppointmentTransaction = async (
    appointmentId: string,
    clientId: string,
    barberId: string,
    serviceItems: CheckoutItem[],
    paymentMethod: CreateTransactionRequest['payment_method'],
    discountAmount: number = 0
  ) => {
    return createTransaction({
      appointment_id: appointmentId,
      client_id: clientId,
      barber_id: barberId,
      items: serviceItems,
      payment_method: paymentMethod,
      discount_amount: discountAmount,
      notes: 'Atendimento concluído'
    });
  };

  return {
    loading,
    createTransaction,
    createAppointmentTransaction
  };
}
