import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, CalendarClock, Scissors, Receipt } from 'lucide-react';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d.split('-').reverse().join('/');
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
};
const STATUS: Record<string, string> = { active: 'Ativo', expired: 'Vencido', cancelled: 'Cancelado', suspended: 'Suspenso', completed: 'Concluído' };

const MyPlansStatement: React.FC<{ refreshKey?: unknown }> = ({ refreshKey }) => {
  const q = useQuery({
    queryKey: ['my-plan-details', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('my-plan-details');
      if (error) throw error;
      return (data?.subscriptions || []) as any[];
    },
  });

  if (q.isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-7 h-7 animate-spin text-urbana-gold" /></div>;
  if (q.isError) return <p className="text-urbana-light/60">Não foi possível carregar seus planos agora.</p>;
  if (!q.data?.length) return <p className="text-urbana-light/60">Você ainda não tem planos contratados.</p>;

  return (
    <div className="space-y-4">
      {q.data.map((s) => {
        const remaining = s.credits_total - s.credits_used;
        const p = s.payment || {};
        return (
          <div key={s.id} className="rounded-2xl border border-urbana-gold/30 bg-urbana-black-soft p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-urbana-light">{s.plan_name}</h3>
                <p className="text-sm text-urbana-light/60">Contratado em {fmtDate(s.start_date)} • {s.source === 'online' ? 'Compra online' : 'Compra na barbearia'}</p>
              </div>
              <span className="rounded-full bg-urbana-gold/15 px-3 py-1 text-sm font-semibold text-urbana-gold">{STATUS[s.status] || s.status}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-urbana-black p-3">
                <p className="text-xs text-urbana-light/50">Créditos disponíveis</p>
                <p className="text-2xl font-black text-urbana-light">{remaining} <span className="text-sm font-medium text-urbana-light/60">de {s.credits_total}</span></p>
                <p className="text-xs text-urbana-light/50">{s.credits_used} usado(s)</p>
              </div>
              <div className="rounded-xl bg-urbana-black p-3">
                <p className="text-xs text-urbana-light/50 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Validade</p>
                <p className="text-lg font-bold text-urbana-light">{fmtDate(s.expires_at)}</p>
              </div>
              <div className="rounded-xl bg-urbana-black p-3">
                <p className="text-xs text-urbana-light/50 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Pagamento</p>
                <p className="text-lg font-bold text-urbana-light">{p.amount != null ? brl(Number(p.amount)) : '—'}</p>
                <p className="text-xs text-urbana-light/70">
                  {p.method}{p.card_brand ? ` ${String(p.card_brand).toUpperCase()}` : ''}{p.card_last4 ? ` final ${p.card_last4}` : ''}{p.installments > 1 ? ` • ${p.installments}x` : ''}
                </p>
                <p className="text-xs text-urbana-light/50">Pago em {fmtDate(p.paid_at)} • {p.status}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-urbana-light/80 flex items-center gap-2 mb-2"><Receipt className="w-4 h-4" /> Onde e quando usei</p>
              {s.usage.length === 0 ? (
                <p className="text-sm text-urbana-light/50">Nenhum crédito utilizado ainda.</p>
              ) : (
                <ul className="divide-y divide-urbana-gold/10">
                  {s.usage.map((u: any, i: number) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="flex items-center gap-2 text-urbana-light"><Scissors className="w-4 h-4 text-urbana-gold" />{u.service_name || 'Serviço'}{u.barber ? ` • com ${u.barber}` : ''}</span>
                      <span className="text-urbana-light/60">{u.appointment_date ? `${fmtDate(u.appointment_date)} ${String(u.appointment_time || '').slice(0, 5)}` : fmtDate(u.used_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyPlansStatement;
