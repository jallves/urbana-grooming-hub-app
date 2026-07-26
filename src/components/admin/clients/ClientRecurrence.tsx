import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Repeat, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
        .select('cliente_id, servico_id, data, hora, status, painel_servicos')
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
              <TableRow className="hover:bg-[#0d0d0d]">
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
                    <div className="flex flex-wrap gap-1">
                      {r.servicos.map((s) => (
                        <Badge key={s.nome} variant="outline" className="text-xs">
                          {s.nome} × {s.qtd}
                        </Badge>
                      ))}
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
                        <Badge key={s.nome} variant="outline" className="text-xs">
                          {s.nome} × {s.qtd}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientRecurrence;