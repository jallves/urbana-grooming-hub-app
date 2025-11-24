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
      if (!user?.email) return { commissions: [], stats: null };

      // Buscar staff ID
      let staffData = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'barber')
        .maybeSingle();

      if (!staffData?.data && user.email) {
        staffData = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .eq('role', 'barber')
          .maybeSingle();
      }

      const staffId = staffData?.data?.id;
      if (!staffId) return { commissions: [], stats: null };

      // Buscar comissões do ERP Financeiro
      const { data: commissionsData } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'commission')
        .eq('barber_id', staffId)
        .order('transaction_date', { ascending: false })
        .limit(50); // Limitar a 50 registros mais recentes

      if (!commissionsData) return { commissions: [], stats: null };

      // Mapear dados
      const commissions: Commission[] = commissionsData.map((record) => {
        const metadata = record.metadata as any;
        const commissionType = record.category === 'Comissões - Serviços' ? 'service' : 'product';
        
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
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,
  });
};
