import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  commission_type: string;
  item_name: string | null;
  appointment_id: string | null;
  product_sale_id: string | null;
}

interface CommissionStats {
  total: number;
  pending: number;
  paid: number;
  serviceCommissions: number;
  productCommissions: number;
}

export const useBarberCommissionsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['barber-commissions', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando comissões para usuário:', { 
        id: user?.id, 
        email: user?.email,
        authUserId: user?.id 
      });
      
      if (!user?.id) {
        console.log('❌ Usuário sem ID');
        return { commissions: [], stats: null };
      }

      // Buscar staff ID usando o user_id do auth
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, email, user_id')
        .eq('user_id', user.id)
        .eq('role', 'barber')
        .maybeSingle();

      console.log('📋 Busca de staff:', { 
        found: !!staffData, 
        staffId: staffData?.id,
        error: staffError,
        searchingFor: user.id
      });

      const staffId = staffData?.id;
      if (!staffId) {
        console.log('❌ Staff ID não encontrado para user_id:', user.id);
        return { commissions: [], stats: null };
      }

      console.log('✅ Staff ID encontrado:', staffId);

      // Buscar comissões do ERP Financeiro
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'commission')
        .eq('barber_id', staffId)
        .order('transaction_date', { ascending: false })
        .limit(50); // Limitar a 50 registros mais recentes

      console.log('💰 Comissões encontradas:', { 
        count: commissionsData?.length, 
        error: commissionsError,
        staffId 
      });

      if (commissionsError) {
        console.error('❌ Erro ao buscar comissões:', commissionsError);
        return { commissions: [], stats: null };
      }

      if (!commissionsData || commissionsData.length === 0) {
        console.log('⚠️ Nenhuma comissão encontrada');
        return { commissions: [], stats: null };
      }

      // Mapear dados
      const commissions: Commission[] = commissionsData.map((record) => {
        const metadata = record.metadata as any;
        // Determinar tipo de comissão pela categoria e subcategoria
        const commissionType = record.category === 'staff_payments' 
          ? 'service' 
          : record.subcategory === 'product_commission' 
            ? 'product' 
            : 'service';
        
        console.log('📊 Mapeando comissão:', {
          id: record.id,
          category: record.category,
          subcategory: record.subcategory,
          type: commissionType,
          amount: record.net_amount,
          status: record.status
        });
        
        return {
          id: record.id,
          amount: Number(record.net_amount),
          status: record.status === 'completed' ? 'paid' : 'pending',
          created_at: record.transaction_date,
          commission_type: commissionType,
          item_name: record.description,
          appointment_id: record.appointment_id,
          product_sale_id: metadata?.product_sale_id || null
        };
      });

      console.log('✅ Total de comissões mapeadas:', commissions.length);

      // Calcular estatísticas
      const stats: CommissionStats = {
        total: commissions.reduce((acc, comm) => acc + Number(comm.amount), 0),
        pending: commissions.filter(c => c.status === 'pending').reduce((acc, comm) => acc + Number(comm.amount), 0),
        paid: commissions.filter(c => c.status === 'paid').reduce((acc, comm) => acc + Number(comm.amount), 0),
        serviceCommissions: commissions.filter(c => c.commission_type === 'service').reduce((acc, comm) => acc + Number(comm.amount), 0),
        productCommissions: commissions.filter(c => c.commission_type === 'product').reduce((acc, comm) => acc + Number(comm.amount), 0)
      };

      return { commissions, stats };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true, // Refetch ao focar na janela
    refetchOnMount: true, // Sempre refetch ao montar
  });
};
