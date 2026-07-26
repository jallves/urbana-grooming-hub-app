import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Repeat, Calendar, TrendingUp, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const COMPLETED_STATUSES = new Set(['concluido', 'concluído', 'confirmado', 'chegou', 'finalizado']);

interface RecurrenceRow {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  totalVisitas: number;
  ultimaVisita: string | null;
  primeiraVisita: string | null;
  servicos: { nome: string; qtd: number }[];
}

const ClientRecurrence: React.FC = () => {
  const [search, setSearch] = useState('');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [historyClient, setHistoryClient] = useState<{ id: string; nome: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes-recorrencia'],
    queryFn: async (): Promise<RecurrenceRow[]> => {
      const { data: clientes, error: cErr } = await supabase
        .from('painel_clientes')
        .select('id, nome, telefone, whatsapp')
        .order('nome');
      if (cErr) throw cErr;
      if (!clientes?.length) return [];

      const { data: ags, error: aErr } = await supabase
        .from('painel_agendamentos')
        .select('cliente_id, servico_id, data, hora, status, painel_servicos, servico:painel_servicos!painel_agendamentos_servico_id_fkey(nome)')
        .in('cliente_id', clientes.map((c) => c.id))
        .order('data', { ascending: false });
      if (aErr) throw aErr;

      const map = new Map<string, RecurrenceRow>();
      for (const c of clientes) {
        map.set(c.id, {
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
          whatsapp: c.whatsapp,
          totalVisitas: 0,
          ultimaVisita: null,
          primeiraVisita: null,
          servicos: [],
        });
      }

      const svcCounts: Record<string, Record<string, number>> = {};
      for (const a of ags || []) {
        if (!a.cliente_id) continue;
        const row = map.get(a.cliente_id);
        if (!row) continue;
        const status = (a.status || '').toLowerCase();
        if (status === 'cancelado' || status === 'no_show') continue;
        if (!COMPLETED_STATUSES.has(status)) continue;

        row.totalVisitas += 1;
        if (!row.ultimaVisita || a.data > row.ultimaVisita) row.ultimaVisita = a.data;
        if (!row.primeiraVisita || a.data < row.primeiraVisita) row.primeiraVisita = a.data;

        const svcNome =
          (a as any).servico?.nome ||
          (a.painel_servicos as any)?.nome ||
          (a.painel_servicos as any)?.name ||
          'Serviço';
        if (!svcCounts[a.cliente_id]) svcCounts[a.cliente_id] = {};
        svcCounts[a.cliente_id][svcNome] = (svcCounts[a.cliente_id][svcNome] || 0) + 1;
      }

      for (const [cid, counts] of Object.entries(svcCounts)) {
        const row = map.get(cid);
        if (!row) continue;
        row.servicos = Object.entries(counts)
          .map(([nome, qtd]) => ({ nome, qtd }))
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 5);
      }

      return Array.from(map.values())
        .filter((r) => r.totalVisitas > 0)
        .sort((a, b) => b.totalVisitas - a.totalVisitas);
    },
    staleTime: 30000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.nome.toLowerCase().includes(q) ||
        (r.telefone || '').includes(q) ||
        (r.whatsapp || '').includes(q),
    );
  }, [data, search]);

  const totais = useMemo(() => {
    if (!data) return { clientes: 0, visitas: 0, media: 0 };
    const visitas = data.reduce((s, r) => s + r.totalVisitas, 0);
    return {
      clientes: data.length,
      visitas,
      media: data.length ? +(visitas / data.length).toFixed(1) : 0,
    };
  }, [data]);

  const fmt = (d: string | null) => {
    if (!d) return '—';
    try {
      return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const openHistory = (id: string, nome: string) => setHistoryClient({ id, nome });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Repeat className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Clientes recorrentes</div>
              <div className="text-xl font-bold">{totais.clientes}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Total de visitas</div>
              <div className="text-xl font-bold">{totais.visitas}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Média por cliente</div>
              <div className="text-xl font-bold">{totais.media}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nome ou telefone..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Nenhum cliente com histórico de visitas.
        </div>
      ) : isDesktop ? (
        <div className="rounded-md border overflow-x-auto bg-background">
          <Table>
            <TableHeader className="bg-[#0d0d0d] sticky top-0 z-10">
              <TableRow className="hover:bg-[#0d0d0d] border-b-0">
                <TableHead className="text-[#f0d78c] font-semibold w-12">#</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold">Cliente</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold">Contato</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold text-center">Visitas</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold">Primeira visita</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold">Última visita</TableHead>
                <TableHead className="text-[#f0d78c] font-semibold">Serviços mais realizados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, idx) => (
                <TableRow key={r.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <TableCell className="font-semibold text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.whatsapp || r.telefone || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-full bg-[#c9a84c]/20 text-[#0d0d0d] font-bold text-sm">
                      {r.totalVisitas}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{fmt(r.primeiraVisita)}</TableCell>
                  <TableCell className="text-sm font-medium">{fmt(r.ultimaVisita)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {r.servicos.map((s) => (
                        <button
                          key={s.nome}
                          type="button"
                          onClick={() => openHistory(r.id, r.nome)}
                          title="Ver histórico completo de serviços deste cliente"
                          className="inline-flex items-center rounded-md border border-[#c9a84c]/50 bg-[#c9a84c]/10 px-2 py-0.5 text-xs font-medium text-[#0d0d0d] hover:bg-[#c9a84c]/30 hover:border-[#c9a84c] transition-colors cursor-pointer"
                        >
                          {s.nome} × {s.qtd}
                        </button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-[#0d0d0d] hover:bg-[#c9a84c]/20"
                        onClick={() => openHistory(r.id, r.nome)}
                      >
                        <History className="h-3 w-3 mr-1" /> Ver tudo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((r, idx) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {idx < 3 && (
                        <Badge variant="secondary" className="text-xs">
                          #{idx + 1}
                        </Badge>
                      )}
                      <h3 className="font-semibold truncate">{r.nome}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.whatsapp || r.telefone || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-primary leading-none">
                      {r.totalVisitas}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      visita{r.totalVisitas !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">Primeira</div>
                    <div className="font-medium">{fmt(r.primeiraVisita)}</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">Última</div>
                    <div className="font-medium">{fmt(r.ultimaVisita)}</div>
                  </div>
                </div>

                {r.servicos.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Serviços</div>
                    <div className="flex flex-wrap gap-1">
                      {r.servicos.map((s) => (
                        <button
                          key={s.nome}
                          type="button"
                          onClick={() => openHistory(r.id, r.nome)}
                          className="inline-flex items-center rounded-md border border-[#c9a84c]/50 bg-[#c9a84c]/10 px-2 py-0.5 text-xs font-medium text-[#0d0d0d] hover:bg-[#c9a84c]/30 transition-colors"
                        >
                          {s.nome} × {s.qtd}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs w-full"
                      onClick={() => openHistory(r.id, r.nome)}
                    >
                      <History className="h-3 w-3 mr-1" /> Ver histórico completo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientServiceHistoryDialog
        client={historyClient}
        onClose={() => setHistoryClient(null)}
      />
    </div>
  );
};

export default ClientRecurrence;

/* ---------- Popup: histórico completo de serviços do cliente ---------- */

interface HistoryRow {
  id: string;
  data: string;
  hora: string;
  status: string | null;
  servico: string | null;
  barbeiro: string | null;
  valor: number | null;
  extras: { nome: string; qtd: number }[];
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  concluido: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-300' },
  concluído: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-300' },
  finalizado: { label: 'Finalizado', className: 'bg-green-100 text-green-700 border-green-300' },
  chegou: { label: 'Chegou', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  confirmado: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  cancelado: { label: 'Cancelado', className: 'bg-rose-100 text-rose-700 border-rose-300' },
  no_show: { label: 'Não compareceu', className: 'bg-orange-100 text-orange-700 border-orange-300' },
};

const ClientServiceHistoryDialog: React.FC<{
  client: { id: string; nome: string } | null;
  onClose: () => void;
}> = ({ client, onClose }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { data, isLoading } = useQuery({
    queryKey: ['client-service-history', client?.id],
    enabled: !!client?.id,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data: ags, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, servicos_extras, valor_final, valor_original,
          painel_servicos, painel_barbeiros,
          servico:painel_servicos!painel_agendamentos_servico_id_fkey(nome, preco),
          barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(nome)
        `)
        .eq('cliente_id', client!.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });
      if (error) throw error;
      return (ags || []).map((a: any) => {
        const extrasRaw: any[] = Array.isArray(a.servicos_extras) ? a.servicos_extras : [];
        const extrasMap = new Map<string, number>();
        let extrasValor = 0;
        for (const e of extrasRaw) {
          const n = e?.nome || e?.name;
          if (!n) continue;
          const qtd = Number(e?.quantidade || e?.qtd || 1);
          extrasMap.set(n, (extrasMap.get(n) || 0) + qtd);
          const preco = Number(e?.preco ?? e?.price ?? e?.valor ?? e?.preco_unitario ?? 0);
          extrasValor += preco * qtd;
        }
        const svcSnap = a.painel_servicos || {};
        const svcRel = a.servico || {};
        const barbSnap = a.painel_barbeiros || {};
        const barbRel = a.barbeiro || {};
        const principalValor = Number(
          svcSnap.preco ?? svcSnap.price ?? svcRel.preco ?? 0,
        );
        const computed = principalValor + extrasValor;
        const valorFinal =
          a.valor_final != null ? Number(a.valor_final) :
          a.valor_original != null ? Number(a.valor_original) :
          computed || null;
        return {
          id: a.id,
          data: a.data,
          hora: a.hora,
          status: a.status,
          servico: svcRel.nome || svcSnap.nome || svcSnap.name || null,
          barbeiro: barbRel.nome || barbSnap.nome || barbSnap.name || null,
          valor: valorFinal,
          extras: Array.from(extrasMap.entries()).map(([nome, qtd]) => ({ nome, qtd })),
        };
      });
    },
    staleTime: 15000,
  });

  const totais = useMemo(() => {
    const list = data || [];
    const validas = list.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s !== 'cancelado' && s !== 'no_show';
    });
    const totalGasto = validas.reduce((s, r) => s + (Number(r.valor) || 0), 0);
    return { total: list.length, validas: validas.length, totalGasto };
  }, [data]);

  const fmtDate = (d: string) => {
    try {
      return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const fmtMoney = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Dialog open={!!client} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-5 w-5 text-[#c9a84c]" />
            <span className="truncate">Histórico — {client?.nome}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Todos os agendamentos já realizados por este cliente na barbearia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 sm:p-6 pt-3">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando histórico...</div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-md border p-2 text-center">
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase">Total</div>
                  <div className="text-base sm:text-lg font-bold">{totais.total}</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase">Realizados</div>
                  <div className="text-base sm:text-lg font-bold text-green-700">{totais.validas}</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase">Gasto</div>
                  <div className="text-sm sm:text-lg font-bold text-[#0d0d0d]">{fmtMoney(totais.totalGasto)}</div>
                </div>
              </div>

              {isDesktop ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#0d0d0d] sticky top-0 z-10">
                      <TableRow className="hover:bg-[#0d0d0d] border-b-0">
                        <TableHead className="text-[#f0d78c] font-semibold">Data</TableHead>
                        <TableHead className="text-[#f0d78c] font-semibold">Serviço</TableHead>
                        <TableHead className="text-[#f0d78c] font-semibold">Extras</TableHead>
                        <TableHead className="text-[#f0d78c] font-semibold">Barbeiro</TableHead>
                        <TableHead className="text-[#f0d78c] font-semibold text-center">Status</TableHead>
                        <TableHead className="text-[#f0d78c] font-semibold text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((r, idx) => {
                        const st = STATUS_LABEL[(r.status || '').toLowerCase()] || {
                          label: r.status || '—',
                          className: 'bg-muted text-foreground border-border',
                        };
                        return (
                          <TableRow key={r.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                            <TableCell className="text-sm whitespace-nowrap">
                              <div className="font-medium">{fmtDate(r.data)}</div>
                              <div className="text-[11px] text-muted-foreground">{r.hora?.slice(0, 5)}</div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{r.servico || '—'}</TableCell>
                            <TableCell className="text-xs">
                              {r.extras.length === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {r.extras.map((e) => (
                                    <Badge key={e.nome} variant="outline" className="text-[10px]">
                                      {e.nome}
                                      {e.qtd > 1 ? ` × ${e.qtd}` : ''}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.barbeiro || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`text-[10px] ${st.className}`}>
                                {st.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-right font-semibold">
                              {fmtMoney(r.valor)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Mobile: cards */
                <div className="space-y-2">
                  {data.map((r) => {
                    const st = STATUS_LABEL[(r.status || '').toLowerCase()] || {
                      label: r.status || '—',
                      className: 'bg-muted text-foreground border-border',
                    };
                    return (
                      <Card key={r.id} className="border">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">
                                {r.servico || '—'}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {fmtDate(r.data)} • {r.hora?.slice(0, 5)}
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${st.className}`}>
                              {st.label}
                            </Badge>
                          </div>

                          {r.extras.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.extras.map((e) => (
                                <Badge key={e.nome} variant="outline" className="text-[10px]">
                                  {e.nome}
                                  {e.qtd > 1 ? ` × ${e.qtd}` : ''}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground truncate">
                              {r.barbeiro || 'Sem barbeiro'}
                            </span>
                            <span className="font-semibold text-[#0d0d0d]">
                              {fmtMoney(r.valor)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};