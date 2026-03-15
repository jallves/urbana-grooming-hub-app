import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientSubscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  payment_method: string | null;
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  client_name?: string;
  client_email?: string;
  client_whatsapp?: string;
  plan_name?: string;
  plan_price?: number;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  period_start: string;
  period_end: string;
  status: string;
  notes: string | null;
  created_at: string;
  client_name?: string;
  plan_name?: string;
}

export const useClientSubscriptions = () => {
  const queryClient = useQueryClient();

  const subsQuery = useQuery({
    queryKey: ['client-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const clientIds = [...new Set((data || []).map((s: any) => s.client_id))];
      const planIds = [...new Set((data || []).map((s: any) => s.plan_id))];

      const [clientsRes, plansRes] = await Promise.all([
        clientIds.length > 0
          ? supabase.from('painel_clientes').select('id, nome, email, whatsapp').in('id', clientIds)
          : Promise.resolve({ data: [] }),
        planIds.length > 0
          ? supabase.from('subscription_plans').select('id, name, price').in('id', planIds)
          : Promise.resolve({ data: [] }),
      ]);

      const clientMap = Object.fromEntries((clientsRes.data || []).map((c: any) => [c.id, c]));
      const planMap = Object.fromEntries((plansRes.data || []).map((p: any) => [p.id, p]));

      return (data || []).map((sub: any) => ({
        ...sub,
        client_name: clientMap[sub.client_id]?.nome || 'Cliente',
        client_email: clientMap[sub.client_id]?.email,
        client_whatsapp: clientMap[sub.client_id]?.whatsapp,
        plan_name: planMap[sub.plan_id]?.name || 'Plano',
        plan_price: planMap[sub.plan_id]?.price || 0,
      })) as ClientSubscription[];
    },
  });

  const createSub = useMutation({
    mutationFn: async (data: {
      client_id: string;
      plan_id: string;
      start_date: string;
      payment_method: string;
      notes?: string;
    }) => {
      // Get plan price for next billing
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('price, billing_period')
        .eq('id', data.plan_id)
        .single();

      const startDate = new Date(data.start_date);
      let nextBilling = new Date(startDate);
      if (plan?.billing_period === 'monthly') nextBilling.setMonth(nextBilling.getMonth() + 1);
      else if (plan?.billing_period === 'quarterly') nextBilling.setMonth(nextBilling.getMonth() + 3);
      else nextBilling.setFullYear(nextBilling.getFullYear() + 1);

      // Get credits_total from plan
      const creditsTotal = (plan as any)?.credits_total || 4;

      const { error } = await supabase.from('client_subscriptions').insert({
        ...data,
        next_billing_date: nextBilling.toISOString().split('T')[0],
        status: 'active',
        credits_total: creditsTotal,
        credits_used: 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (err: any) => toast.error('Erro ao criar assinatura', { description: err.message }),
  });

  const cancelSub = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('client_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
      toast.success('Assinatura cancelada');
    },
    onError: (err: any) => toast.error('Erro', { description: err.message }),
  });

  const paymentsQuery = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Enrich with sub/client/plan names
      const subIds = [...new Set((data || []).map((p: any) => p.subscription_id))];
      if (subIds.length === 0) return [] as SubscriptionPayment[];

      const { data: subs } = await supabase
        .from('client_subscriptions')
        .select('id, client_id, plan_id')
        .in('id', subIds);

      const clientIds = [...new Set((subs || []).map((s: any) => s.client_id))];
      const planIds = [...new Set((subs || []).map((s: any) => s.plan_id))];

      const [clientsRes, plansRes] = await Promise.all([
        clientIds.length > 0 ? supabase.from('painel_clientes').select('id, nome').in('id', clientIds) : Promise.resolve({ data: [] }),
        planIds.length > 0 ? supabase.from('subscription_plans').select('id, name').in('id', planIds) : Promise.resolve({ data: [] }),
      ]);

      const subMap = Object.fromEntries((subs || []).map((s: any) => [s.id, s]));
      const clientMap = Object.fromEntries((clientsRes.data || []).map((c: any) => [c.id, c]));
      const planMap = Object.fromEntries((plansRes.data || []).map((p: any) => [p.id, p]));

      return (data || []).map((pay: any) => {
        const sub = subMap[pay.subscription_id];
        return {
          ...pay,
          client_name: sub ? clientMap[sub.client_id]?.nome : 'Cliente',
          plan_name: sub ? planMap[sub.plan_id]?.name : 'Plano',
        };
      }) as SubscriptionPayment[];
    },
  });

  const registerPayment = useMutation({
    mutationFn: async (data: {
      subscription_id: string;
      amount: number;
      payment_method: string;
      period_start: string;
      period_end: string;
      notes?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Insert subscription payment
      const { error } = await supabase.from('subscription_payments').insert({
        ...data,
        status: 'paid',
        payment_date: today,
      } as any);
      if (error) throw error;

      // 2. Update next billing date and reset credits
      const endDate = new Date(data.period_end);
      endDate.setMonth(endDate.getMonth() + 1);
      await supabase
        .from('client_subscriptions')
        .update({ 
          next_billing_date: endDate.toISOString().split('T')[0],
          credits_used: 0,
        } as any)
        .eq('id', data.subscription_id);

      // 3. Get subscription details for ERP integration
      const { data: subData } = await supabase
        .from('client_subscriptions')
        .select('client_id, plan_id')
        .eq('id', data.subscription_id)
        .single();

      let clientName = 'Cliente';
      let planName = 'Plano';
      if (subData) {
        const [cRes, pRes] = await Promise.all([
          supabase.from('painel_clientes').select('nome').eq('id', subData.client_id).single(),
          supabase.from('subscription_plans').select('name').eq('id', subData.plan_id).single(),
        ]);
        clientName = cRes.data?.nome || clientName;
        planName = pRes.data?.name || planName;
      }

      // Map payment method to ERP format
      const payMethodMap: Record<string, string> = {
        credit_card: 'credito',
        pix: 'pix',
        cash: 'dinheiro',
        debit: 'debito',
      };

      // 4. Create contas_receber entry for ERP
      await supabase.from('contas_receber').insert({
        descricao: `Assinatura ${planName} — ${clientName}`,
        valor: data.amount,
        data_vencimento: data.period_end,
        data_recebimento: today,
        status: 'pago',
        categoria: 'Assinatura',
        forma_pagamento: payMethodMap[data.payment_method] || data.payment_method,
        cliente_id: subData?.client_id || null,
        observacoes: data.notes || `Pagamento assinatura período ${data.period_start} a ${data.period_end}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
      toast.success('Pagamento registrado!');
    },
    onError: (err: any) => toast.error('Erro', { description: err.message }),
  });

  return {
    subscriptions: subsQuery.data || [],
    payments: paymentsQuery.data || [],
    loading: subsQuery.isLoading,
    paymentsLoading: paymentsQuery.isLoading,
    createSub,
    cancelSub,
    registerPayment,
  };
};
