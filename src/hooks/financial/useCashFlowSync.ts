import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SyncToCashFlowParams {
  financialRecordId: string;
  transactionType: 'revenue' | 'expense' | 'commission';
  amount: number;
  description: string;
  category: string;
  paymentMethod?: string;
  transactionDate: string;
  metadata?: Record<string, any>;
}

/**
 * Hook para sincronizar transações do Financial Records com Cash Flow
 * O Fluxo de Caixa é o controlador central de todas as movimentações financeiras
 */
export function useCashFlowSync() {
  const queryClient = useQueryClient();

  const syncToCashFlow = useMutation({
    mutationFn: async (params: SyncToCashFlowParams) => {
      const {
        financialRecordId,
        transactionType,
        amount,
        description,
        category,
        paymentMethod,
        transactionDate,
        metadata
      } = params;

      // Verificar se já existe registro no cash_flow para este financial_record
      const { data: existingCashFlow } = await supabase
        .from('cash_flow')
        .select('id')
        .eq('reference_id', financialRecordId)
        .maybeSingle();

      if (existingCashFlow) {
        // Já está sincronizado
        return { alreadySynced: true, cashFlowId: existingCashFlow.id };
      }

      // Mapear o tipo de transação
      const cashFlowType = transactionType === 'revenue' ? 'income' : 'expense';
      
      // Mapear categoria para português
      let categoryPT = category;
      if (category === 'staff_payments' || category === 'commissions') {
        categoryPT = 'Pagamento Comissão';
      }

      // Criar entrada no cash_flow
      const { data: cashFlowEntry, error } = await supabase
        .from('cash_flow')
        .insert({
          transaction_type: cashFlowType,
          amount: amount,
          description: description,
          category: categoryPT,
          payment_method: paymentMethod || 'other',
          transaction_date: format(new Date(transactionDate), 'yyyy-MM-dd'),
          reference_id: financialRecordId,
          notes: metadata ? JSON.stringify(metadata) : null,
        })
        .select()
        .single();

      if (error) throw error;

      return { alreadySynced: false, cashFlowId: cashFlowEntry.id };
    },
    onSuccess: (result) => {
      if (!result.alreadySynced) {
        toast.success('✅ Sincronizado com Fluxo de Caixa', {
          description: 'A transação foi registrada automaticamente no controle de caixa.'
        });
      }
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-current-month'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
    },
    onError: (error: any) => {
      console.error('Erro ao sincronizar com Fluxo de Caixa:', error);
      toast.error('Erro na sincronização', {
        description: 'Não foi possível registrar no Fluxo de Caixa. Por favor, registre manualmente.'
      });
    }
  });

  const removeCashFlowSync = useMutation({
    mutationFn: async (financialRecordId: string) => {
      // Remover entrada do cash_flow relacionada
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('reference_id', financialRecordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-current-month'] });
    },
    onError: (error: any) => {
      console.error('Erro ao remover sincronização:', error);
    }
  });

  return {
    syncToCashFlow: syncToCashFlow.mutate,
    syncToCashFlowAsync: syncToCashFlow.mutateAsync,
    removeCashFlowSync: removeCashFlowSync.mutate,
    isSyncing: syncToCashFlow.isPending
  };
}