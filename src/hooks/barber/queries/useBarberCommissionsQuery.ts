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
  payment_date: string | null;
}

interface CommissionStats {
  total: number;
  pending: number;
  paid: number;
  serviceCommissions: number;
  productCommissions: number;
  tipCommissions: number;
}

export const useBarberCommissionsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['barber-commissions', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando comissões para usuário:', { 
        id: user?.id, 
        email: user?.email
      });
      
      if (!user?.id || !user?.email) {
        console.log('❌ Usuário sem ID ou email');
        return { commissions: [], stats: null };
      }

      // IMPORTANTE: Buscar barbeiro pelo email na tabela painel_barbeiros
      // pois financial_records.barber_id referencia painel_barbeiros.id
      const { data: barberData, error: barberError } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email')
        .eq('email', user.email)
        .eq('ativo', true)
        .maybeSingle();

      console.log('📋 Busca de barbeiro (painel_barbeiros):', { 
        found: !!barberData, 
        barberId: barberData?.id,
        barberName: barberData?.nome,
        error: barberError,
        searchingFor: user.email
      });

      const barberId = barberData?.id;
      if (!barberId) {
        console.log('❌ Barbeiro não encontrado para email:', user.email);
        return { commissions: [], stats: null };
      }

      console.log('✅ Barbeiro ID encontrado:', barberId);

      // Buscar de AMBAS as tabelas para garantir dados completos:
      // 1. barber_commissions (tabela principal de comissões)
      // 2. financial_records (ERP - para comissões antigas ou não migradas)

      // 1. Buscar de barber_commissions
      const { data: barberCommissionsData, error: bcError } = await supabase
        .from('barber_commissions')
        .select('*')
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (bcError) {
        console.error('❌ Erro ao buscar barber_commissions:', bcError);
      }

      console.log('💰 barber_commissions encontradas:', barberCommissionsData?.length || 0);

      // 2. Buscar de financial_records (backup/ERP)
      const { data: financialRecordsData, error: frError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'commission')
        .eq('barber_id', barberId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (frError) {
        console.error('❌ Erro ao buscar financial_records:', frError);
      }

      console.log('💰 financial_records (commission) encontradas:', financialRecordsData?.length || 0);

      // Combinar e deduplicar (priorizar barber_commissions)
      const commissionMap = new Map<string, Commission>();

      // Primeiro, adicionar de barber_commissions
      barberCommissionsData?.forEach((record) => {
        const tipo = record.tipo || 'servico';
        let commissionType = 'service';
        if (tipo === 'produto') commissionType = 'product';
        if (tipo === 'gorjeta') commissionType = 'tip';
        if (tipo === 'servico_extra') commissionType = 'service';

        const key = `bc-${record.id}`;
        commissionMap.set(key, {
          id: record.id,
          amount: Number(record.valor || record.amount || 0),
          status: record.status === 'paid' || record.status === 'pago' ? 'paid' : 'pending',
          created_at: record.created_at || '',
          commission_type: commissionType,
          item_name: record.barber_name ? `${tipo === 'gorjeta' ? 'Gorjeta' : tipo === 'produto' ? 'Produto' : 'Serviço'}` : null,
          appointment_id: record.appointment_id,
          product_sale_id: record.venda_id,
          payment_date: record.payment_date || record.data_pagamento || null,
        });
      });

      // Depois, adicionar de financial_records (se não existir duplicata)
      financialRecordsData?.forEach((record) => {
        // Verificar se já existe uma comissão equivalente pelo reference_id
        const existsKey = Array.from(commissionMap.values()).find(c => 
          c.product_sale_id === record.reference_id && 
          Math.abs(c.amount - Number(record.net_amount || record.amount)) < 0.01
        );

        if (!existsKey) {
          const category = record.category || '';
          const subcategory = record.subcategory || '';
          
          let commissionType = 'service';
          if (category === 'products' || subcategory.includes('product')) commissionType = 'product';
          if (category === 'tips' || subcategory.includes('tip')) commissionType = 'tip';

          const key = `fr-${record.id}`;
          commissionMap.set(key, {
            id: record.id,
            amount: Number(record.net_amount || record.amount || 0),
            status: record.status === 'completed' ? 'paid' : 'pending',
            created_at: record.transaction_date || record.created_at || '',
            commission_type: commissionType,
            item_name: record.description || null,
            appointment_id: record.reference_id,
            product_sale_id: record.reference_id,
            payment_date: record.payment_date || null,
          });
        }
      });

      const commissions = Array.from(commissionMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ Total de comissões combinadas:', commissions.length);

      // Calcular estatísticas
      const stats: CommissionStats = {
        total: commissions.reduce((acc, comm) => acc + Number(comm.amount), 0),
        pending: commissions.filter(c => c.status === 'pending').reduce((acc, comm) => acc + Number(comm.amount), 0),
        paid: commissions.filter(c => c.status === 'paid').reduce((acc, comm) => acc + Number(comm.amount), 0),
        serviceCommissions: commissions.filter(c => c.commission_type === 'service').reduce((acc, comm) => acc + Number(comm.amount), 0),
        productCommissions: commissions.filter(c => c.commission_type === 'product').reduce((acc, comm) => acc + Number(comm.amount), 0),
        tipCommissions: commissions.filter(c => c.commission_type === 'tip').reduce((acc, comm) => acc + Number(comm.amount), 0),
      };

      console.log('📊 Estatísticas:', stats);

      return { commissions, stats };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
