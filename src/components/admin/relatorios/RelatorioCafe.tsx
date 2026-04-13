import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coffee } from 'lucide-react';

interface Props { filters: { mes: number; ano: number } }

const RelatorioCafe: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-cafe', filters],
    queryFn: async () => {
      const { data: records } = await supabase
        .from('coffee_records')
        .select('quantity, created_at, client_id, barber_id')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      const total = records?.reduce((s, r) => s + (r.quantity || 1), 0) || 0;
      const registros = records?.length || 0;

      // Group by day
      const byDay: Record<string, number> = {};
      records?.forEach(r => {
        const day = r.created_at.split('T')[0];
        byDay[day] = (byDay[day] || 0) + (r.quantity || 1);
      });

      // Average per day (only days with records)
      const diasComRegistro = Object.keys(byDay).length;
      const mediaDia = diasComRegistro > 0 ? total / diasComRegistro : 0;

      // Group by week
      const byWeek: Record<string, number> = {};
      records?.forEach(r => {
        const date = new Date(r.created_at);
        const weekNum = Math.ceil(date.getDate() / 7);
        const key = `Semana ${weekNum}`;
        byWeek[key] = (byWeek[key] || 0) + (r.quantity || 1);
      });

      return { total, registros, mediaDia, byDay: Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 15), byWeek: Object.entries(byWeek).sort() };
    }
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 text-center">
            <Coffee className="h-8 w-8 text-amber-700 mx-auto mb-1" />
            <p className="text-3xl font-bold text-amber-700">{data?.total || 0}</p>
            <p className="text-xs text-gray-500">Total no Mês</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{data?.registros || 0}</p>
            <p className="text-xs text-gray-500">Registros</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{(data?.mediaDia || 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500">Média/Dia</p>
          </CardContent>
        </Card>
      </div>

      {/* By Week */}
      {(data?.byWeek?.length || 0) > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm">☕ Por Semana</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byWeek.map(([week, count]) => (
              <div key={week} className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{week}</span>
                <span className="text-sm font-bold text-amber-700">{count} café{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* By Day */}
      {(data?.byDay?.length || 0) > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm">☕ Últimos Dias</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-1">
            {data?.byDay.map(([day, count]) => {
              const [y, m, d] = day.split('-');
              return (
                <div key={day} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">{d}/{m}/{y}</span>
                  <span className="text-sm font-bold text-amber-700">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {data?.total === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum café registrado no período</p>}
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" /></div>; }

export default RelatorioCafe;
