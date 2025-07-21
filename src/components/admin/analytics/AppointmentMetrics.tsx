
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const AppointmentMetrics: React.FC = () => {
  const { data: appointmentData, isLoading } = useQuery({
    queryKey: ['appointment-metrics'],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, services(name, price), staff(name)');

      // Status distribution
      const statusCount = appointments?.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusData = [
        { name: 'Concluído', value: statusCount.completed || 0, color: '#10B981' },
        { name: 'Agendado', value: statusCount.scheduled || 0, color: '#F59E0B' },
        { name: 'Cancelado', value: statusCount.cancelled || 0, color: '#EF4444' },
        { name: 'Confirmado', value: statusCount.confirmed || 0, color: '#6B7280' }
      ];

      // Horários mais procurados
      const hourlyData = appointments?.reduce((acc, apt) => {
        const hour = new Date(apt.start_time).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {};

      const hourlyChart = Object.entries(hourlyData).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
      })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Performance por barbeiro
      const staffPerformance = appointments?.reduce((acc, apt) => {
        const staffName = apt.staff?.name || 'Não atribuído';
        if (!acc[staffName]) {
          acc[staffName] = { name: staffName, completed: 0, total: 0 };
        }
        acc[staffName].total += 1;
        if (apt.status === 'completed') {
          acc[staffName].completed += 1;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const staffData = Object.values(staffPerformance).map((staff: any) => ({
        ...staff,
        rate: staff.total > 0 ? (staff.completed / staff.total) * 100 : 0
      }));

      return {
        totalAppointments: appointments?.length || 0,
        completedAppointments: statusCount.completed || 0,
        cancelledAppointments: statusCount.cancelled || 0,
        conversionRate: appointments?.length ? (statusCount.completed / appointments.length) * 100 : 0,
        statusData,
        hourlyChart,
        staffData
      };
    }
  });

  const metrics = [
    {
      title: 'Total Agendamentos',
      value: appointmentData?.totalAppointments?.toString() || '0',
      icon: Calendar,
      color: 'text-blue-400'
    },
    {
      title: 'Concluídos',
      value: appointmentData?.completedAppointments?.toString() || '0',
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Cancelados',
      value: appointmentData?.cancelledAppointments?.toString() || '0',
      icon: XCircle,
      color: 'text-red-400'
    },
    {
      title: 'Taxa de Conversão',
      value: `${appointmentData?.conversionRate?.toFixed(1) || '0'}%`,
      icon: Clock,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="h-full bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-gray-100">Métricas de Agendamentos</h2>
        <p className="text-sm text-gray-400">Análise de performance e padrões de agendamento</p>
      </div>

      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{metric.title}</p>
                      <p className="text-lg font-bold text-gray-100">{metric.value}</p>
                    </div>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Status dos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentData?.statusData || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {appointmentData?.statusData?.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Horários Mais Procurados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentData?.hourlyChart || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Performance dos Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointmentData?.staffData?.map((staff: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-100">{staff.name}</p>
                      <p className="text-sm text-gray-400">{staff.completed}/{staff.total} agendamentos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-100">{staff.rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">Taxa de conclusão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentMetrics;
