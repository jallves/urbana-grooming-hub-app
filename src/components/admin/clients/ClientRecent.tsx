import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecentClient {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
  primeiroAgendamento: { data: string; hora: string; status: string | null; servico: string | null } | null;
  totalAgendamentos: number;
}

const ClientRecent: React.FC = () => {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<'20' | '50' | '100' | '200'>('50');

  const { data, isLoading } = useQuery({
    queryKey: ['clientes-recentes', limit],
    queryFn: async (): Promise<RecentClient[]> => {
      const { data: clientes, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, telefone, whatsapp, email, created_at')
        .order('created_at', { ascending: false })
        .limit(Number(limit));
      if (error) throw error;
      if (!clientes?.length) return [];

      const ids = clientes.map((c) => c.id);
      const { data: ags } = await supabase
        .from('painel_agendamentos')
        .select('cliente_id, data, hora, status, painel_servicos')
        .in('cliente_id', ids)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      const firstMap = new Map<string, RecentClient['primeiroAgendamento']>();
      const countMap = new Map<string, number>();
      for (const a of ags || []) {
        if (!a.cliente_id) continue;
        countMap.set(a.cliente_id, (countMap.get(a.cliente_id) || 0) + 1);
        if (!firstMap.has(a.cliente_id)) {
          firstMap.set(a.cliente_id, {
            data: a.data,
            hora: a.hora,
            status: a.status,
            servico:
              (a.painel_servicos as any)?.nome ||
              (a.painel_servicos as any)?.name ||
              null,
          });
        }
      }

      return clientes.map((c) => ({
        ...c,
        primeiroAgendamento: firstMap.get(c.id) || null,
        totalAgendamentos: countMap.get(c.id) || 0,
      }));
    },
    staleTime: 30000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone || '').includes(q) ||
        (c.whatsapp || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const totais = useMemo(() => {
    if (!data) return { total: 0, agendaram: 0, semAgenda: 0 };
    const agendaram = data.filter((c) => c.totalAgendamentos > 0).length;
    return { total: data.length, agendaram, semAgenda: data.length - agendaram };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Novos cadastros</div>
              <div className="text-xl font-bold">{totais.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Já agendaram</div>
              <div className="text-xl font-bold">{totais.agendaram}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-xs text-muted-foreground">Sem agendamento</div>
              <div className="text-xl font-bold">{totais.semAgenda}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="pl-9"
          />
        </div>
        <Select value={limit} onValueChange={(v) => setLimit(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">Últimos 20</SelectItem>
            <SelectItem value="50">Últimos 50</SelectItem>
            <SelectItem value="100">Últimos 100</SelectItem>
            <SelectItem value="200">Últimos 200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const jaAgendou = c.totalAgendamentos > 0;
            let cadastro = '—';
            try {
              cadastro = format(parseISO(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
            } catch {}
            let cadastroRel = '';
            try {
              cadastroRel = formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: ptBR });
            } catch {}

            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{c.nome}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.whatsapp || c.telefone || c.email || '—'}
                      </p>
                    </div>
                    {jaAgendou ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 shrink-0">
                        Sem agenda
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">Cadastrado</div>
                    <div className="font-medium">{cadastro}</div>
                    {cadastroRel && (
                      <div className="text-[11px] text-muted-foreground">{cadastroRel}</div>
                    )}
                  </div>

                  {c.primeiroAgendamento ? (
                    <div className="text-xs bg-primary/5 border border-primary/10 rounded p-2">
                      <div className="text-muted-foreground mb-0.5">Primeiro agendamento</div>
                      <div className="font-medium">
                        {(() => {
                          try {
                            return format(parseISO(c.primeiroAgendamento.data), 'dd/MM/yyyy', { locale: ptBR });
                          } catch {
                            return c.primeiroAgendamento.data;
                          }
                        })()}{' '}
                        às {c.primeiroAgendamento.hora?.slice(0, 5)}
                      </div>
                      {c.primeiroAgendamento.servico && (
                        <div className="text-[11px] text-muted-foreground">
                          {c.primeiroAgendamento.servico}
                        </div>
                      )}
                      <div className="text-[11px] mt-1">
                        Total de agendamentos:{' '}
                        <span className="font-semibold">{c.totalAgendamentos}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 text-orange-700">
                      Ainda não realizou nenhum agendamento
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientRecent;