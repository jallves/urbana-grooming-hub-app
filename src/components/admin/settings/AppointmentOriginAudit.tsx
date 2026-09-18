import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Monitor, ShieldCheck } from 'lucide-react';
import { appointmentOriginLabel } from '@/lib/appointmentOrigin';

interface Row {
  id: string;
  data: string;
  hora: string;
  status: string;
  created_at: string;
  origem: string | null;
  origem_user_id: string | null;
  origem_device: string | null;
  cliente: { nome: string | null; email: string | null; user_id: string | null } | null;
  barbeiro: { nome: string | null } | null;
  servico: { nome: string | null } | null;
}

const originStyles: Record<string, string> = {
  painel_cliente: 'bg-blue-100 text-blue-800 border-blue-200',
  totem: 'bg-green-100 text-green-800 border-green-200',
  painel_barbeiro: 'bg-amber-100 text-amber-800 border-amber-200',
  painel_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  desconhecida: 'bg-gray-100 text-gray-700 border-gray-200',
};

const deviceLabel = (ua?: string | null) => {
  if (!ua) return 'Não informado';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone/iPad';
  if (/SM-X210|Tablet/i.test(ua)) return 'Tablet da loja';
  if (/Android/i.test(ua)) return 'Celular Android';
  if (/Windows/i.test(ua)) return 'Computador Windows';
  if (/Macintosh/i.test(ua)) return 'Computador Mac';
  return 'Outro aparelho';
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const AppointmentOriginAudit: React.FC = () => {
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('todas');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['appointment-origin-audit'],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, created_at, origem, origem_user_id, origem_device,
          cliente:painel_clientes!painel_agendamentos_cliente_id_fkey(nome, email, user_id),
          barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(nome),
          servico:painel_servicos!painel_agendamentos_servico_id_fkey(nome)
        `)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data || []) as unknown as Row[];
    },
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data || []).filter((r) => {
      const matchOrigin = origin === 'todas' || (r.origem || 'desconhecida') === origin;
      const matchTerm =
        !term ||
        (r.cliente?.nome || '').toLowerCase().includes(term) ||
        (r.cliente?.email || '').toLowerCase().includes(term) ||
        (r.barbeiro?.nome || '').toLowerCase().includes(term);
      return matchOrigin && matchTerm;
    });
  }, [data, search, origin]);

  const counters = useMemo(() => {
    const acc: Record<string, number> = {};
    (data || []).forEach((r) => {
      const key = r.origem || 'desconhecida';
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Origem dos Agendamentos
          </CardTitle>
          <CardDescription>
            Mostra de onde cada agendamento dos últimos 30 dias foi criado: painel do cliente, totem,
            painel do barbeiro ou painel administrativo — com o aparelho utilizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(counters).map(([key, total]) => (
              <Badge key={key} variant="outline" className={originStyles[key] || originStyles.desconhecida}>
                {appointmentOriginLabel(key)}: {total}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, e-mail ou barbeiro"
                className="pl-9"
              />
            </div>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as origens</SelectItem>
                <SelectItem value="painel_cliente">Painel do Cliente</SelectItem>
                <SelectItem value="totem">Totem</SelectItem>
                <SelectItem value="painel_barbeiro">Painel do Barbeiro</SelectItem>
                <SelectItem value="painel_admin">Painel Administrativo</SelectItem>
                <SelectItem value="desconhecida">Origem desconhecida</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum registro encontrado.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-3 bg-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {r.cliente?.nome || 'Cliente removido'} — {r.servico?.nome || 'Serviço'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${r.data}T00:00:00`).toLocaleDateString('pt-BR')} às {r.hora?.slice(0, 5)} ·{' '}
                      {r.barbeiro?.nome || 'Sem barbeiro'} · {r.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {formatDateTime(r.created_at)}
                      {r.origem_user_id && r.cliente?.user_id === r.origem_user_id
                        ? ' · pela própria conta do cliente'
                        : r.origem_user_id
                        ? ' · por outra conta logada'
                        : ' · sem conta identificada'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={originStyles[r.origem || 'desconhecida'] || originStyles.desconhecida}
                    >
                      {appointmentOriginLabel(r.origem)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {deviceLabel(r.origem_device)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentOriginAudit;
