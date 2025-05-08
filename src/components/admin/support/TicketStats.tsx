
import React, { useMemo } from 'react';
import { SupportTicket } from '@/types/support';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface TicketStatsProps {
  tickets: SupportTicket[];
}

const TicketStats: React.FC<TicketStatsProps> = ({ tickets }) => {
  const statusStats = useMemo(() => {
    const statusCount = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    tickets.forEach((ticket) => {
      if (ticket.status in statusCount) {
        statusCount[ticket.status as keyof typeof statusCount]++;
      }
    });

    return [
      { name: 'Abertos', value: statusCount.open, color: '#ef4444' },
      { name: 'Em Progresso', value: statusCount.in_progress, color: '#6366f1' },
      { name: 'Resolvidos', value: statusCount.resolved, color: '#10b981' },
      { name: 'Fechados', value: statusCount.closed, color: '#94a3b8' },
    ];
  }, [tickets]);

  const priorityStats = useMemo(() => {
    const priorityCount = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    tickets.forEach((ticket) => {
      if (ticket.priority in priorityCount) {
        priorityCount[ticket.priority as keyof typeof priorityCount]++;
      }
    });

    return [
      { name: 'Baixa', value: priorityCount.low, color: '#94a3b8' },
      { name: 'Média', value: priorityCount.medium, color: '#6366f1' },
      { name: 'Alta', value: priorityCount.high, color: '#f97316' },
      { name: 'Crítica', value: priorityCount.critical, color: '#ef4444' },
    ];
  }, [tickets]);

  // Calcula tempos médios de resposta e resolução (dados fictícios para exemplo)
  const responseTimeStats = [
    { name: 'Crítica', time: 1.5, color: '#ef4444' },
    { name: 'Alta', time: 3, color: '#f97316' },
    { name: 'Média', time: 8, color: '#6366f1' },
    { name: 'Baixa', time: 24, color: '#94a3b8' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Status dos Tickets</CardTitle>
          <CardDescription>Distribuição de tickets por status</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter className="pt-0 justify-center">
          <div className="flex flex-wrap gap-3 justify-center">
            {statusStats.map((status) => (
              <div key={status.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-xs">
                  {status.name}: {status.value}
                </span>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tickets por Prioridade</CardTitle>
          <CardDescription>Distribuição de tickets por nível de prioridade</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityStats}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {priorityStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter className="pt-0 justify-center">
          <div className="flex flex-wrap gap-3 justify-center">
            {priorityStats.map((priority) => (
              <div key={priority.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                <span className="text-xs">
                  {priority.name}: {priority.value}
                </span>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tempo Médio de Resposta</CardTitle>
          <CardDescription>Tempo médio de primeira resposta por prioridade (horas)</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseTimeStats}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} horas`, 'Tempo Resposta']} />
              <Legend />
              <Bar dataKey="time" name="Horas" radius={[4, 4, 0, 0]}>
                {responseTimeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Desempenho</CardTitle>
          <CardDescription>Indicadores de desempenho do suporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{tickets.length}</p>
              <p className="text-sm text-muted-foreground">Total de tickets</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">Tickets pendentes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {((tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length / 
                  (tickets.length || 1)) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de resolução</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">Satisfação média</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketStats;
