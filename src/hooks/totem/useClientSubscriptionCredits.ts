import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlanServiceCreditCost {
  service_id: string;
  credits_cost: number;
}

export interface ActiveSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_price: number;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  credit_unit_value: number;
  status: string;
  start_date: string;
  expires_at: string | null;
  next_billing_date: string | null;
  allowed_service_ids: string[];
  service_credits_map: Record<string, number>; // service_id -> credits_cost
}

export const useClientSubscriptionCredits = () => {
  const [loading, setLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);

  const checkCredits = useCallback(async (clientId: string): Promise<ActiveSubscription | null> => {
    setLoading(true);
    try {
      // Buscar assinatura ativa do cliente
      const { data: subs, error } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !subs || subs.length === 0) {
        setActiveSubscription(null);
        return null;
      }

      const sub = subs[0];

      // Buscar nome do plano e serviços permitidos em paralelo
      const [planRes, servicesRes] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('name, price')
          .eq('id', sub.plan_id)
          .single(),
        supabase
          .from('subscription_plan_services')
          .select('service_id, credits_cost')
          .eq('plan_id', sub.plan_id),
      ]);

      const plan = planRes.data;
      const planServicesData = servicesRes.data || [];
      const allowedServiceIds = planServicesData.map((s: any) => s.service_id);
      const serviceCreditsMap: Record<string, number> = {};
      planServicesData.forEach((s: any) => {
        serviceCreditsMap[s.service_id] = s.credits_cost || 1;
      });

      const creditsTotal = sub.credits_total || 4;
      const creditsUsed = sub.credits_used || 0;
      const creditUnitValue = (plan?.price || 0) > 0 && creditsTotal > 0 
        ? Number(((plan?.price || 0) / creditsTotal).toFixed(2)) 
        : 0;

      const result: ActiveSubscription = {
        id: sub.id,
        plan_id: sub.plan_id,
        plan_name: plan?.name || 'Plano',
        plan_price: plan?.price || 0,
        credits_total: creditsTotal,
        credits_used: creditsUsed,
        credits_remaining: creditsTotal - creditsUsed,
        credit_unit_value: creditUnitValue,
        status: sub.status,
        start_date: sub.start_date,
        expires_at: (sub as any).expires_at || null,
        next_billing_date: sub.next_billing_date,
        allowed_service_ids: allowedServiceIds,
        service_credits_map: serviceCreditsMap,
      };

      setActiveSubscription(result);
      return result;
    } catch (err) {
      console.error('Erro ao verificar créditos:', err);
      setActiveSubscription(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Consumo de créditos feito SOMENTE no servidor (titular, saldo, validade e cobertura)
  const useCredit = useCallback(async (
    _subscriptionId: string,
    appointmentId: string,
    _serviceName: string | string[],
    _creditsCost: number = 1,
    serviceIds: string[] = []
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('consume_subscription_credits' as any, {
        p_appointment_id: appointmentId,
        p_service_ids: serviceIds,
      });
      if (error) {
        console.error('Erro ao usar crédito:', error);
        return false;
      }
      return (data as any)?.success === true;
    } catch (err) {
      console.error('Erro ao usar crédito:', err);
      return false;
    }
  }, []);

  return {
    loading,
    activeSubscription,
    checkCredits,
    useCredit,
  };
};
