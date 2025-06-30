
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  revenue: number;
}

interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  total_appointments: number;
  completed_appointments: number;
  revenue: number;
}

const AppointmentReports: React.FC = () => {
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    revenue: 0
  });
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('month');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }),
          endDate: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
      case 'year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31)
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch appointment statistics
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services(price),
          staff(id, name)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (appointmentsError) throw appointmentsError;

      // Calculate statistics
      const total = appointments?.length || 0;
      const completed = appointments?.filter(apt => apt.status === 'completed').length || 0;
      const cancelled = appointments?.filter(apt => apt.status === 'cancelled').length || 0;
      const pending = appointments?.filter(apt => apt.status === 'scheduled').length || 0;
      
      const revenue = appointments?.reduce((sum, apt) => {
        if (apt.status === 'completed') {
          const servicePrice = apt.services?.price || 0;
          const discount = apt.discount_amount || 0;
          return sum + (servicePrice - discount);
        }
        return sum;
      }, 0) || 0;

      setStats({ total, completed, cancelled, pending, revenue });

      // Calculate staff performance
      const staffStats = new Map<string, StaffPerformance>();
      
      appointments?.forEach(apt => {
        if (apt.staff) {
          const staffId = apt.staff.id;
          const staffName = apt.staff.name;
          
          if (!staffStats.has(staffId)) {
            staffStats.set(staffId, {
              staff_id: staffId,
              staff_name: staffName,
              total_appointments: 0,
              completed_appointments: 0,
              revenue: 0
            });
          }
          
          const staffStat = staffStats.get(staffId)!;
          staffStat.total_appointments++;
          
          if (apt.status === 'completed') {
            staffStat.completed_appointments++;
            const servicePrice = apt.services?.price || 0;
            const discount = apt.discount_amount || 0;
            staffStat.revenue += (servicePrice - discount);
          }
        }
      });

      setStaffPerformance(Array.from(staffStats.values()));
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeText = () => {
    const { startDate, endDate } = getDateRange();
    return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Agendamentos</h2>
          <p className="text-muted-foreground">{getDateRangeText()}</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Apenas agendamentos concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho dos Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : staffPerformance.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum dado encontrado para o período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Profissional</th>
                    <th className="text-left p-2">Total de Agendamentos</th>
                    <th className="text-left p-2">Concluídos</th>
                    <th className="text-left p-2">Taxa de Conclusão</th>
                    <th className="text-left p-2">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map((staff) => (
                    <tr key={staff.staff_id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{staff.staff_name}</td>
                      <td className="p-2">{staff.total_appointments}</td>
                      <td className="p-2">{staff.completed_appointments}</td>
                      <td className="p-2">
                        {staff.total_appointments > 0 
                          ? ((staff.completed_appointments / staff.total_appointments) * 100).toFixed(1)
                          : 0}%
                      </td>
                      <td className="p-2">R$ {staff.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentReports;
