import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Scissors, Clock, CheckCircle2, XCircle, Activity, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PAINEL_PIN = '7487';
const PAINEL_AUTH_KEY = 'painel_fila_authenticated';

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

const STATUS_META: Record<
  StatusKey,
  {
    label: string;
    headerBg: string;
    border: string;
    text: string;
    accentBar: string;
    icon: React.ComponentType<{ className?: string }>;
    pulse?: boolean;
  }
> = {
  em_atendimento: {
    label: 'EM ATENDIMENTO',
    headerBg: 'bg-emerald-500/15',
    border: 'border-emerald-400/70',
    text: 'text-emerald-300',
    accentBar: 'bg-emerald-400',
    icon: Activity,
    pulse: true,
  },
  agendado: {
    label: 'AGENDADO',
    headerBg: 'bg-sky-500/10',
    border: 'border-sky-400/50',
    text: 'text-sky-300',
    accentBar: 'bg-sky-400',
    icon: Clock,
  },
  concluido: {
    label: 'CONCLUÍDO',
    headerBg: 'bg-urbana-gold/15',
    border: 'border-urbana-gold/70',
    text: 'text-urbana-gold',
    accentBar: 'bg-urbana-gold',
    icon: CheckCircle2,
  },
  cancelado: {
    label: 'CANCELADO',
    headerBg: 'bg-zinc-700/30',
    border: 'border-zinc-600/60',
    text: 'text-zinc-400',
    accentBar: 'bg-zinc-500',
    icon: XCircle,
  },
};

const SECTION_ORDER: StatusKey[] = ['em_atendimento', 'agendado', 'concluido', 'cancelado'];

// Keypad compacto e responsivo para o Painel — adapta-se a landscape sem cortar o logo
const PainelAuthKeypad: React.FC<{ onSubmit: (pin: string) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [value, setValue] = useState('');
  const press = (n: number) => setValue((v) => (v.length < 4 ? v + n : v));
  const back = () => setValue((v) => v.slice(0, -1));
  const clear = () => setValue('');
  const submit = () => value.length === 4 && onSubmit(value);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-gradient-to-br from-urbana-black via-zinc-950 to-urbana-brown/60 flex items-center justify-center p-3 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.12),_transparent_60%)]" />

      <div className="relative z-10 w-full max-w-[920px] h-full max-h-[680px] flex flex-col landscape:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-10">
        {/* Identidade */}
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 landscape:flex-1 shrink-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 landscape:w-24 landscape:h-24 lg:w-28 lg:h-28 rounded-2xl bg-urbana-black-soft/80 border-2 border-urbana-gold/50 p-3 shadow-2xl">
            <img src={costaUrbanaLogo} alt="Costa Urbana" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-urbana-gold/80">Costa Urbana</p>
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-urbana-light mt-1">Painel da Fila</h1>
            <p className="text-[11px] sm:text-sm text-urbana-light/60 mt-0.5">Digite o PIN para liberar</p>
          </div>

          {/* Display PIN */}
          <div className="bg-urbana-black/60 border-2 border-urbana-gold/40 rounded-xl px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all',
                  i < value.length ? 'bg-urbana-gold border-urbana-gold shadow-md shadow-urbana-gold/50' : 'border-urbana-gold/30',
                )}
              />
            ))}
          </div>
        </div>

        {/* Teclado compacto */}
        <div className="w-full max-w-[280px] sm:max-w-[320px] landscape:max-w-[300px] lg:max-w-[360px] landscape:flex-1 landscape:max-h-full">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => press(n)}
                disabled={loading}
                className="h-10 sm:h-12 landscape:h-11 lg:h-14 text-lg sm:text-xl lg:text-2xl font-bold text-urbana-gold bg-transparent border-2 border-urbana-gold/40 rounded-lg active:scale-95 active:bg-urbana-gold/30 transition-transform"
              >
                {n}
              </button>
            ))}
            <button onClick={clear} disabled={loading} className="h-10 sm:h-12 landscape:h-11 lg:h-14 text-xs font-bold text-urbana-light bg-transparent border-2 border-urbana-gray/40 rounded-lg active:scale-95">
              Limpar
            </button>
            <button onClick={() => press(0)} disabled={loading} className="h-10 sm:h-12 landscape:h-11 lg:h-14 text-lg sm:text-xl lg:text-2xl font-bold text-urbana-gold bg-transparent border-2 border-urbana-gold/40 rounded-lg active:scale-95 active:bg-urbana-gold/30">
              0
            </button>
            <button onClick={back} disabled={loading} className="h-10 sm:h-12 landscape:h-11 lg:h-14 flex items-center justify-center text-urbana-light bg-transparent border-2 border-urbana-gray/40 rounded-lg active:scale-95">
              <Delete className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={value.length < 4 || loading}
            className={cn(
              'mt-2 sm:mt-3 w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg font-black rounded-lg transition-transform active:scale-[0.98] shadow-lg shadow-urbana-gold/30',
              value.length === 4 && !loading
                ? 'bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black'
                : 'bg-urbana-gray/40 text-urbana-light/40 cursor-not-allowed',
            )}
          >
            {loading ? 'VALIDANDO...' : 'LIBERAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PainelFila: React.FC = () => {
  const queryClient = useQueryClient();
  const [today, setToday] = useState(() => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd'));
  const [now, setNow] = useState(() => new Date());
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(PAINEL_AUTH_KEY) === '1';
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Tick do relógio + virada de dia (a cada 30s checa se mudou o dia em SP)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      const todayBR = formatInTimeZone(current, TZ, 'yyyy-MM-dd');
      setToday((prev) => (prev !== todayBR ? todayBR : prev));
    }, 1000);
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
    refetchInterval: 5 * 1000, // fallback: a cada 5s
    refetchOnWindowFocus: true,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`painel-fila-${today}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'painel_agendamentos' },
        (payload) => {
          console.log('🔔 [PainelFila] Realtime evento:', payload.eventType, payload);
          queryClient.invalidateQueries({ queryKey: ['painel-fila', today] });
          refetch();
        },
      )
      .subscribe((status) => {
        console.log('📡 [PainelFila] Status do canal realtime:', status);
        if (status === 'SUBSCRIBED') {
          refetch();
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, queryClient, refetch]);

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
  const dataDisplay = formatInTimeZone(now, TZ, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const horaDisplay = formatInTimeZone(now, TZ, 'HH:mm');
  const segundosDisplay = formatInTimeZone(now, TZ, 'ss');

  if (!authenticated) {
    const handlePin = async (pin: string) => {
      setAuthLoading(true);
      await new Promise((r) => setTimeout(r, 200));
      if (pin === PAINEL_PIN) {
        sessionStorage.setItem(PAINEL_AUTH_KEY, '1');
        setAuthenticated(true);
        toast.success('Painel liberado');
      } else {
        toast.error('PIN incorreto', { description: 'Tente novamente.' });
      }
      setAuthLoading(false);
    };
    return <PainelAuthKeypad onSubmit={handlePin} loading={authLoading} />;
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)] bg-black text-white font-raleway flex flex-col">
      {/* Faixa dourada superior */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-transparent via-urbana-gold to-transparent" />

      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 lg:p-6 gap-2 sm:gap-4 lg:gap-6">
        {/* Header */}
        <header className="shrink-0 flex flex-row items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-urbana-gold/10 border-2 border-urbana-gold/40 flex items-center justify-center shrink-0 p-1 sm:p-1.5">
              <img src={costaUrbanaLogo} alt="Costa Urbana" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs lg:text-sm uppercase tracking-[0.3em] text-urbana-gold/80 truncate">
                Barbearia Costa Urbana
              </p>
              <h1 className="text-lg sm:text-3xl lg:text-5xl font-playfair font-bold text-white leading-tight truncate">
                Painel do Dia
              </h1>
              <p className="text-[10px] sm:text-sm lg:text-lg text-zinc-400 mt-0.5 capitalize truncate">
                {dataDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-stretch gap-2 sm:gap-3 shrink-0">
            {/* Relógio */}
            <div className="rounded-xl sm:rounded-2xl border border-urbana-gold/30 bg-zinc-900/60 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 backdrop-blur">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5 sm:mb-1 hidden sm:block">Horário</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-4xl lg:text-6xl font-mono font-bold text-white tabular-nums leading-none">
                  {horaDisplay}
                </span>
                <span className="text-xs sm:text-xl lg:text-2xl font-mono text-urbana-gold tabular-nums leading-none">
                  :{segundosDisplay}
                </span>
              </div>
            </div>
            {/* Resumo */}
            <div className="rounded-xl sm:rounded-2xl border border-zinc-700 bg-zinc-900/60 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 backdrop-blur">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5 sm:mb-1 hidden sm:block">Hoje</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 lg:gap-3">
                <div>
                  <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold tabular-nums leading-none">
                    {totalAtivos}
                  </span>
                  <span className="text-[9px] sm:text-xs text-zinc-400 ml-1 hidden sm:inline">ativos</span>
                </div>
                <span className="text-zinc-700">/</span>
                <div>
                  <span className="text-base sm:text-2xl lg:text-3xl font-semibold text-zinc-300 tabular-nums leading-none">
                    {items.length}
                  </span>
                  <span className="text-[9px] sm:text-xs text-zinc-500 ml-1 hidden sm:inline">total</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Grid de status */}
        <div className="flex-1 min-h-0 grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-5">
          {SECTION_ORDER.map((key) => {
            const meta = STATUS_META[key];
            const list = grouped[key];
            const Icon = meta.icon;
            return (
              <section
                key={key}
                className={`group relative rounded-xl sm:rounded-2xl border ${meta.border} bg-zinc-950/70 backdrop-blur overflow-hidden flex flex-col min-h-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]`}
              >
                {/* Barra lateral colorida */}
                <div className={`absolute top-0 left-0 h-full w-1 ${meta.accentBar}`} />

                {/* Header da coluna */}
                <div className={`shrink-0 ${meta.headerBg} px-2 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 flex items-center justify-between border-b ${meta.border}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 shrink-0 ${meta.text} ${meta.pulse ? 'animate-pulse' : ''}`} />
                    <h2 className={`text-[10px] sm:text-sm lg:text-base font-bold tracking-wider ${meta.text} truncate`}>
                      {meta.label}
                    </h2>
                  </div>
                  <span className={`text-lg sm:text-2xl lg:text-4xl font-bold ${meta.text} tabular-nums leading-none`}>
                    {list.length}
                  </span>
                </div>

                {/* Lista */}
                <div className="flex-1 min-h-0 p-1.5 sm:p-2 lg:p-3 overflow-hidden">
                  {list.length === 0 ? (
                    <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center px-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-zinc-800 flex items-center justify-center mb-2">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
                      </div>
                      <p className="text-zinc-600 italic text-[10px] sm:text-sm">Nenhum agendamento</p>
                    </div>
                  ) : (
                    <ul className="h-full grid grid-flow-row auto-rows-fr gap-1 sm:gap-1.5 overflow-hidden">
                      {list.map((item) => (
                        <li
                          key={item.id}
                          className={`relative min-h-0 bg-black/50 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 border border-white/5 flex items-center justify-between gap-1.5 sm:gap-3 transition-all hover:border-white/10 ${
                            meta.pulse ? 'ring-1 ring-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] sm:text-sm lg:text-lg xl:text-xl font-semibold text-white truncate leading-tight">
                              {shortName(item.cliente_nome)}
                            </p>
                            <p className="text-[9px] sm:text-[11px] lg:text-xs text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                              <Scissors className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              <span className="truncate">{item.barbeiro_nome}</span>
                            </p>
                          </div>
                          <div className={`text-right shrink-0 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${meta.headerBg} border ${meta.border}`}>
                            <span className={`text-xs sm:text-base lg:text-xl font-bold tabular-nums ${meta.text} leading-none block`}>
                              {item.hora?.slice(0, 5)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="shrink-0 flex flex-row items-center justify-between gap-2 text-[9px] sm:text-xs lg:text-sm text-zinc-600 border-t border-zinc-900 pt-2 sm:pt-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Atualização automática em tempo real</span>
            <span className="sm:hidden">Tempo real</span>
          </div>
          <div className="text-zinc-700">Costa Urbana · {today}</div>
        </footer>
      </div>
    </div>
  );
};

export default PainelFila;