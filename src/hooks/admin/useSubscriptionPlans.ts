import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billing_period: string;
  is_active: boolean;
  display_order: number;
  color: string | null;
  icon: string | null;
  credits_total: number;
  created_at: string;
  services?: { id: string; nome: string; preco: number }[];
}

export interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_period: string;
  is_active: boolean;
  color: string;
  display_order: number;
  service_ids: string[];
  credits_total: number;
}

export const useSubscriptionPlans = () => {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');
      if (error) throw error;

      // Fetch services for each plan
      const { data: planServices } = await supabase
        .from('subscription_plan_services')
        .select('plan_id, service_id');

      const { data: services } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco')
        .eq('is_active', true);

      return (plans || []).map((plan: any) => ({
        ...plan,
        services: (planServices || [])
          .filter((ps: any) => ps.plan_id === plan.id)
          .map((ps: any) => services?.find((s: any) => s.id === ps.service_id))
          .filter(Boolean),
      })) as SubscriptionPlan[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const { service_ids, ...planData } = data;
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .insert(planData as any)
        .select()
        .single();
      if (error) throw error;

      if (service_ids.length > 0) {
        const { error: svcError } = await supabase
          .from('subscription_plan_services')
          .insert(service_ids.map(sid => ({ plan_id: plan.id, service_id: sid })) as any);
        if (svcError) throw svcError;
      }
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano criado com sucesso!');
    },
    onError: (err: any) => toast.error('Erro ao criar plano', { description: err.message }),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const { service_ids, ...planData } = data;
      const { error } = await supabase
        .from('subscription_plans')
        .update(planData as any)
        .eq('id', id);
      if (error) throw error;

      // Replace services
      await supabase.from('subscription_plan_services').delete().eq('plan_id', id);
      if (service_ids.length > 0) {
        await supabase
          .from('subscription_plan_services')
          .insert(service_ids.map(sid => ({ plan_id: id, service_id: sid })) as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano atualizado!');
    },
    onError: (err: any) => toast.error('Erro ao atualizar plano', { description: err.message }),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano removido!');
    },
    onError: (err: any) => toast.error('Erro ao remover plano', { description: err.message }),
  });

  return { plans: plansQuery.data || [], loading: plansQuery.isLoading, createPlan, updatePlan, deletePlan };
};
