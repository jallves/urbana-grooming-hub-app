import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const TZ = 'America/Sao_Paulo';

type FilaItem = {
  id: string;
  hora: string;
  cliente_nome: string;
  barbeiro_nome: string;
  status: string | null;
  status_totem: string | null;
};

type StatusKey = 'concluido' | 'em_atendimento' | 'agendado' | 'cancelado';

const shortName = (full: string): string => {
  if (!full) return 'Cliente';
  const parts = full.trim().split(/\s+/);
  return parts.slice(0, 2).join(' ');
};

const resolveStatus = (item: FilaItem): StatusKey => {
  const s = (item.status || '').toLowerCase();
  const st = (item.status_totem || '').toUpperCase();
  if (s === 'concluido' || st === 'FINALIZADO') return 'concluido';
  if (s === 'cancelado' || s === 'ausente' || s === 'no_show') return 'cancelado';
  if (st === 'CHEGOU') return 'em_atendimento';
  return 'agendado';
};

const STATUS_META: Record<StatusKey, { label: string; bg: string; border: string; text: string; pulse?: boolean }> = {
  agendado: {
    label: 'AGENDADO',
    bg: 'bg-blue-950/60',
    border: 'border-blue-400/60',
    text: 'text-blue-200',
  },
  em_atendimento: {
    label: 'EM ATENDIMENTO',
    bg: 'bg-emerald-900/70',
    border: 'border-emerald-400',
    text: 'text-emerald-200',
    pulse: true,
  },
  concluido: {
    label: 'CONCLUÍDO',
    bg: 'bg-urbana-gold/20',
    border: 'border-urbana-gold',
    text: 'text-urbana-gold',
  },
  cancelado: {
    label: 'CANCELADO',
    bg: 'bg-zinc-800/60',
    border: 'border-zinc-600',
    text: 'text-zinc-400',
  },
};

const SECTION_ORDER: StatusKey[] = ['em_atendimento', 'agendado', 'concluido', 'cancelado'];

const PainelFila: React.FC = () => {
  const queryClient = useQueryClient();
  const [today, setToday] = useState(() => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd'));
  const [now, setNow] = useState(() => new Date());

  // Tick do relógio + virada de dia (a cada 30s checa se mudou o dia em SP)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      const todayBR = formatInTimeZone(current, TZ, 'yyyy-MM-dd');
      setToday((prev) => (prev !== todayBR ? todayBR : prev));
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: items = [], refetch } = useQuery<FilaItem[]>({
    queryKey: ['painel-fila', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          hora,
          status,
          status_totem,
          painel_clientes(nome),
          painel_barbeiros(nome)
        `)
        .eq('data', today)
        .order('hora', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        hora: row.hora,
        status: row.status,
        status_totem: row.status_totem,
        cliente_nome: row.painel_clientes?.nome ?? 'Cliente',
        barbeiro_nome: row.painel_barbeiros?.nome ?? '—',
      }));
    },
    staleTime: 0,
    refetchInterval: 30 * 1000, // fallback: a cada 30s
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`painel-fila-${today}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'painel_agendamentos', filter: `data=eq.${today}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['painel-fila', today] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, queryClient]);

  // Refetch quando o dia muda
  useEffect(() => {
    refetch();
  }, [today, refetch]);

  const grouped = useMemo(() => {
    const map: Record<StatusKey, FilaItem[]> = {
      em_atendimento: [],
      agendado: [],
      concluido: [],
      cancelado: [],
    };
    for (const item of items) {
      const key = resolveStatus(item);
      map[key].push(item);
    }
    return map;
  }, [items]);

  const totalAtivos = grouped.em_atendimento.length + grouped.agendado.length;
  const dataDisplay = formatInTimeZone(now, TZ, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const horaDisplay = formatInTimeZone(now, TZ, 'HH:mm:ss');

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white p-3 sm:p-6 lg:p-10 font-raleway">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-urbana-gold/40 pb-4 mb-5 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-playfair font-bold text-urbana-gold tracking-wide leading-tight">
            Costa Urbana <span className="hidden sm:inline">—</span> <span className="block sm:inline">Painel do Dia</span>
          </h1>
          <p className="text-sm sm:text-lg lg:text-2xl text-zinc-300 mt-1 capitalize">{dataDisplay}</p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-3xl sm:text-5xl lg:text-7xl font-mono font-bold text-white tabular-nums">{horaDisplay}</div>
          <p className="text-xs sm:text-sm lg:text-base text-zinc-400 mt-1">
            {totalAtivos} ativo(s) · {items.length} no total
          </p>
        </div>
      </header>

      {/* Grid de status */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {SECTION_ORDER.map((key) => {
          const meta = STATUS_META[key];
          const list = grouped[key];
          return (
            <section
              key={key}
              className={`rounded-2xl border-2 ${meta.border} ${meta.bg} p-3 sm:p-4 lg:p-5 flex flex-col min-h-[160px]`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className={`text-base sm:text-xl lg:text-2xl font-bold ${meta.text} flex items-center gap-2`}>
                  {meta.pulse && (
                    <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {meta.label}
                </h2>
                <span className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${meta.text} tabular-nums`}>
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="text-zinc-500 italic text-xs sm:text-sm mt-2">Nenhum agendamento</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
                  {list.map((item) => (
                    <li
                      key={item.id}
                      className={`bg-black/40 rounded-lg px-2.5 sm:px-3 py-2.5 sm:py-3 border border-white/5 flex items-center justify-between gap-2 sm:gap-3 ${
                        meta.pulse ? 'ring-1 ring-emerald-400/40' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base lg:text-xl font-semibold text-white truncate">
                          {shortName(item.cliente_nome)}
                        </p>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-zinc-400 truncate">
                          {item.barbeiro_nome}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tabular-nums">
                          {item.hora?.slice(0, 5)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <footer className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs lg:text-sm text-zinc-500">
        Atualização automática em tempo real · {today}
      </footer>
    </div>
  );
};

export default PainelFila;