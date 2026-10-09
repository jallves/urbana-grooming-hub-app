import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, CheckCircle2, ShieldCheck, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d?: string | null) => (d ? d.split('-').reverse().join('/') : '—');

const PainelClientePlanos: React.FC = () => {
  const { cliente } = usePainelClienteAuth() as any;
  const [params, setParams] = useSearchParams();
  const [buying, setBuying] = useState<string | null>(null);

  const plansQ = useQuery({
    queryKey: ['client-plans-catalog'],
    queryFn: async () => {
      const [{ data: plans }, { data: ps }, { data: svcs }] = await Promise.all([
        supabase.from('subscription_plans').select('id, name, description, price, credits_total').eq('is_active', true).order('display_order'),
        supabase.from('subscription_plan_services').select('plan_id, service_id, credits_cost'),
        supabase.from('painel_servicos').select('id, nome'),
      ]);
      return (plans || []).map((p: any) => ({
        ...p,
        services: (ps || []).filter((x: any) => x.plan_id === p.id).map((x: any) => (svcs || []).find((s: any) => s.id === x.service_id)?.nome).filter(Boolean),
      }));
    },
  });

  const subQ = useQuery({
    queryKey: ['client-own-subscription', cliente?.id],
    enabled: !!cliente?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('client_subscriptions')
        .select('id, plan_id, status, credits_total, credits_used, expires_at, start_date')
        .eq('client_id', cliente.id).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1);
      return (data?.[0] as any) || null;
    },
  });

  // Confirma o pagamento no servidor (Stripe) e ativa o plano; guarda a sessão para tentar de novo (Pix)
  useEffect(() => {
    const st = params.get('status');
    if (st === 'cancelado') { toast.info('Pagamento cancelado'); setParams({}, { replace: true }); return; }
    const sid = params.get('session_id') || localStorage.getItem('pending_plan_session');
    if (!sid) return;
    localStorage.setItem('pending_plan_session', sid);
    let tries = 0; let stop = false;
    const verify = async () => {
      if (stop) return;
      const { data } = await supabase.functions.invoke('verify-plan-checkout', { body: { session_id: sid } });
      if (data?.status === 'active') {
        localStorage.removeItem('pending_plan_session');
        toast.success('Plano ativado! Seus créditos já estão disponíveis.');
        setParams({}, { replace: true });
        subQ.refetch();
      } else if (data?.status === 'failed' || data?.error === 'Acesso negado') {
        localStorage.removeItem('pending_plan_session');
        if (data?.error) toast.error(data.error);
      } else if (++tries < 20) {
        setTimeout(verify, 5000);
      }
    };
    verify();
    return () => { stop = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sub = subQ.data;
  const remaining = sub ? sub.credits_total - sub.credits_used : 0;
  const canBuy = !sub || remaining <= 0;

  const buy = async (planId: string) => {
    setBuying(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-plan-checkout', { body: { plan_id: planId } });
      if (error || !data?.url) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
        toast.error(msg || 'Não foi possível iniciar o pagamento');
        return;
      }
      window.location.href = data.url;
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-urbana-gold flex items-center gap-2"><Crown className="w-7 h-7" /> Planos</h1>
        <p className="text-urbana-light/70 mt-1">Créditos válidos por 365 dias. Pessoal e intransferível.</p>
      </div>

      {sub && (
        <div className="rounded-2xl border-2 border-urbana-gold/40 bg-urbana-black-soft p-5">
          <p className="text-sm text-urbana-light/60">Seu plano atual</p>
          <p className="text-3xl font-black text-urbana-light mt-1">{remaining} <span className="text-lg font-semibold text-urbana-light/60">de {sub.credits_total} créditos</span></p>
          <p className="flex items-center gap-2 text-urbana-light/70 mt-2"><CalendarClock className="w-4 h-4" /> Válido até {fmtDate(sub.expires_at)}</p>
          {remaining > 0 && <p className="text-xs text-urbana-light/50 mt-2">A renovação fica disponível após usar todos os créditos.</p>}
        </div>
      )}

      {plansQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-urbana-gold" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(plansQ.data || []).map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-urbana-gold/30 bg-urbana-black-soft p-5 flex flex-col">
              <h2 className="text-xl font-bold text-urbana-light">{p.name}</h2>
              <p className="text-3xl font-black text-urbana-gold mt-2">{brl(Number(p.price))}</p>
              <p className="text-sm text-urbana-light/60">{p.credits_total} créditos • 365 dias</p>
              <ul className="mt-4 space-y-1 text-sm text-urbana-light/80 flex-1">
                {p.services.map((n: string) => <li key={n} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-urbana-gold" />{n} = 1 crédito</li>)}
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-urbana-gold" />Corte e Barba = 2 créditos</li>
              </ul>
              <Button className="mt-5 h-12 font-bold bg-urbana-gold text-urbana-black" disabled={!canBuy || buying !== null} onClick={() => buy(p.id)}>
                {buying === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : canBuy ? 'Assinar' : 'Créditos ainda ativos'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-urbana-light/50"><ShieldCheck className="w-4 h-4" /> Pagamento processado com segurança pela Stripe. O plano é ativado automaticamente após a confirmação.</p>
    </div>
  );
};

export default PainelClientePlanos;
