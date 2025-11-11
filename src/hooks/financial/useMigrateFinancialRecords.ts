import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Hook para migrar registros financeiros existentes (completed) para o cash_flow
 */
export function useMigrateFinancialRecords() {
  const queryClient = useQueryClient();

  const migrateRecords = useMutation({
    mutationFn: async () => {
      // 1. Buscar todos os registros completed que não estão no cash_flow
      const { data: completedRecords, error: fetchError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('status', 'completed')
        .order('transaction_date', { ascending: false });

      if (fetchError) throw fetchError;

      if (!completedRecords || completedRecords.length === 0) {
        return { migrated: 0, skipped: 0, total: 0 };
      }

      let migrated = 0;
      let skipped = 0;
      const errors: any[] = [];

      // 2. Para cada registro, verificar se já existe no cash_flow
      for (const record of completedRecords) {
        try {
          // Verificar se já existe
          const { data: existing } = await supabase
            .from('cash_flow')
            .select('id')
            .eq('reference_type', 'financial_record')
            .eq('reference_id', record.id)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }

          // Mapear tipo de transação
          const cashFlowType = record.transaction_type === 'revenue' ? 'income' : 'expense';

          // Extrair payment_method do metadata
          const metadata = typeof record.metadata === 'object' && record.metadata !== null 
            ? record.metadata as Record<string, any>
            : {};

          const paymentMethod = metadata?.payment_method || 'other';

          // Mapear categoria para português
          let categoryPT = record.category;
          if (record.category === 'staff_payments' || record.category === 'commissions') {
            categoryPT = 'Pagamento Comissão';
          }

          // Criar entrada no cash_flow
          const { error: insertError } = await supabase
            .from('cash_flow')
            .insert({
              transaction_type: cashFlowType,
              amount: record.net_amount,
              description: record.description,
              category: categoryPT,
              payment_method: paymentMethod,
              transaction_date: format(new Date(record.transaction_date), 'yyyy-MM-dd'),
              reference_type: 'financial_record',
              reference_id: record.id,
              notes: metadata?.notes ? String(metadata.notes) : `Migrado automaticamente - ${record.transaction_number}`,
            });

          if (insertError) {
            errors.push({ record: record.id, error: insertError });
            continue;
          }

          migrated++;
        } catch (err) {
          errors.push({ record: record.id, error: err });
        }
      }

      return {
        total: completedRecords.length,
        migrated,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-current-month'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });

      toast.success('✅ Migração concluída!', {
        description: `${result.migrated} registros migrados, ${result.skipped} já existiam. Total processado: ${result.total}`
      });

      if (result.errors && result.errors.length > 0) {
        toast.warning('⚠️ Alguns registros tiveram erro', {
          description: `${result.errors.length} registros não puderam ser migrados`
        });
      }
    },
    onError: (error: any) => {
      console.error('Erro na migração:', error);
      toast.error('❌ Erro na migração', {
        description: error.message
      });
    }
  });

  return {
    migrateRecords: migrateRecords.mutate,
    isMigrating: migrateRecords.isPending
  };
}
