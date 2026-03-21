import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  next_billing_date: string | null;
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

      // Buscar nome do plano
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('name, price')
        .eq('id', sub.plan_id)
        .single();

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
        status: sub.status,
        start_date: sub.start_date,
        next_billing_date: sub.next_billing_date,
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

  const useCredit = useCallback(async (
    subscriptionId: string,
    appointmentId: string,
    serviceName: string
  ): Promise<boolean> => {
    try {
      // 1. Registrar uso do crédito
      const { error: usageError } = await supabase
        .from('subscription_usage')
        .insert({
          subscription_id: subscriptionId,
          appointment_id: appointmentId,
          service_name: serviceName,
        } as any);

      if (usageError) {
        console.error('Erro ao registrar uso:', usageError);
        return false;
      }

      // 2. Incrementar credits_used na assinatura
      // Fetch current then update (no RPC needed)
      const { data: current } = await supabase
        .from('client_subscriptions')
        .select('credits_used')
        .eq('id', subscriptionId)
        .single();

      const newCreditsUsed = ((current as any)?.credits_used || 0) + 1;

      const { error: updateError } = await supabase
        .from('client_subscriptions')
        .update({ credits_used: newCreditsUsed } as any)
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('Erro ao atualizar créditos:', updateError);
        return false;
      }

      return true;
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
