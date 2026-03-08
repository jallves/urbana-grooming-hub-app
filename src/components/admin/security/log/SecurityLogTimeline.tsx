import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { SecurityLog } from './securityLogTypes';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  logs: SecurityLog[];
}

const SecurityLogTimeline: React.FC<Props> = ({ logs }) => {
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.created_at && format(parseISO(l.created_at), 'yyyy-MM-dd') === dayStr);

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        Criações: dayLogs.filter(l => l.action === 'create').length,
        Atualizações: dayLogs.filter(l => l.action === 'update').length,
        Exclusões: dayLogs.filter(l => l.action === 'delete').length,
        Sessões: dayLogs.filter(l => l.action === 'login' || l.action === 'logout').length,
        Outros: dayLogs.filter(l => !['create', 'update', 'delete', 'login', 'logout'].includes(l.action)).length,
        total: dayLogs.length,
      };
    });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Atividade nos últimos 14 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
                      <p className="font-semibold mb-1">{item?.fullDate}</p>
                      {payload.map((p: any) => (
                        p.value > 0 && (
                          <div key={p.dataKey} className="flex justify-between gap-4">
                            <span style={{ color: p.color }}>{p.dataKey}</span>
                            <span className="font-bold">{p.value}</span>
                          </div>
                        )
                      ))}
                      <div className="border-t mt-1 pt-1 flex justify-between gap-4 font-bold">
                        <span>Total</span>
                        <span>{item?.total}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Criações" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Atualizações" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Exclusões" stackId="a" fill="#ef4444" />
              <Bar dataKey="Sessões" stackId="a" fill="#a855f7" />
              <Bar dataKey="Outros" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityLogTimeline;
