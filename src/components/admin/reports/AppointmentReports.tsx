import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface StaffPerformance {
  staff: string;
  total: number;
  completed: number;
  rate: number;
}

const AppointmentReports: React.FC = () => {
  // Fetch appointments data
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointment-reports'],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, services(name), barbers(name)')
        .gte('start_time', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time');
      
      if (error) throw new Error(error.message);
      
      return appointments;
    }
  });

  // Process monthly appointment data
  const monthlyData = React.useMemo(() => {
    if (!appointmentsData) return [];
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthAppointments = appointmentsData.filter(apt => {
        const appointmentMonth = new Date(apt.start_time).getMonth();
        return appointmentMonth === monthIndex;
      });
      
      const completed = monthAppointments.filter(apt => apt.status === 'completed').length;
      const cancelled = monthAppointments.filter(apt => apt.status === 'cancelled').length;
      const scheduled = monthAppointments.filter(apt => apt.status === 'scheduled').length;
      
      monthlyStats.push({
        month: months[monthIndex],
        completed,
        cancelled,
        scheduled,
        total: monthAppointments.length
      });
    }
    
    return monthlyStats;
  }, [appointmentsData]);

  // Process status distribution
  const statusData = React.useMemo(() => {
    if (!appointmentsData) return [];
    
    const statusCounts = {
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      'no-show': 0
    };
    
    appointmentsData.forEach(apt => {
      if (statusCounts[apt.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[apt.status as keyof typeof statusCounts]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'completed' ? 'Concluído' : 
            status === 'scheduled' ? 'Agendado' :
            status === 'cancelled' ? 'Cancelado' : 'Não Compareceu',
      value: count
    }));
  }, [appointmentsData]);

  // Process staff performance
  const staffData = React.useMemo((): StaffPerformance[] => {
    if (!appointmentsData) return [];
    
    const staffStats: Record<string, { total: number; completed: number }> = {};
    
    appointmentsData.forEach(apt => {
      const staffName = apt.barbers?.name || 'Não Definido';
      if (!staffStats[staffName]) {
        staffStats[staffName] = { total: 0, completed: 0 };
      }
      staffStats[staffName].total++;
      if (apt.status === 'completed') {
        staffStats[staffName].completed++;
      }
    });
    
    return Object.entries(staffStats).map(([name, stats]) => ({
      staff: name,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));
  }, [appointmentsData]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!appointmentsData) return {};
    
    const total = appointmentsData.length;
    const completed = appointmentsData.filter(apt => apt.status === 'completed').length;
    const cancelled = appointmentsData.filter(apt => apt.status === 'cancelled').length;
    const noShow = appointmentsData.filter(apt => apt.status === 'no-show').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
    
    // Calculate average appointments per day
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    const thisMonthAppointments = appointmentsData.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= monthStart && aptDate <= monthEnd;
    }).length;
    
    const avgPerDay = Math.round(thisMonthAppointments / daysInMonth * 10) / 10;
    
    return {
      total,
      completed,
      completionRate,
      cancellationRate,
      noShowRate,
      avgPerDay
    };
  }, [appointmentsData]);

  if (isLoadingAppointments) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{summaryMetrics.total}</div>
            <p className="text-xs text-muted-foreground">Total de Agendamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{summaryMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{summaryMetrics.cancellationRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de Cancelamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{summaryMetrics.avgPerDay}</div>
            <p className="text-xs text-muted-foreground">Média por Dia (Este Mês)</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Agendamentos</CardTitle>
          <CardDescription>
            Agendamentos dos últimos 6 meses por status (dados reais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Concluídos" fill="#4ade80" />
                <Bar dataKey="scheduled" name="Agendados" fill="#3b82f6" />
                <Bar dataKey="cancelled" name="Cancelados" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Distribuição de todos os agendamentos por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Profissional</CardTitle>
            <CardDescription>
              Taxa de conclusão de agendamentos por profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffData.length > 0 ? (
              <div className="space-y-4">
                {staffData.map((staff, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{staff.staff}</span>
                      <span>{staff.rate}% ({staff.completed}/{staff.total})</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${staff.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de profissional encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentReports;
