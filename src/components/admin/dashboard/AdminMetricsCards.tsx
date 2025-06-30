
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

const AdminMetricsCards: React.FC = () => {
  // Fetch appointments count
  const { data: appointmentsCount } = useQuery({
    queryKey: ['appointments-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch clients count
  const { data: clientsCount } = useQuery({
    queryKey: ['clients-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch staff count
  const { data: staffCount } = useQuery({
    queryKey: ['staff-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch revenue (from completed appointments)
  const { data: revenue } = useQuery({
    queryKey: ['revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          services!inner(price),
          discount_amount
        `)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, appointment) => {
        const servicePrice = appointment.services?.price || 0;
        const discount = appointment.discount_amount || 0;
        return sum + (servicePrice - discount);
      }, 0) || 0;
      
      return total;
    },
  });

  const metrics = [
    {
      title: 'Total de Agendamentos',
      value: appointmentsCount || 0,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Clientes Cadastrados',
      value: clientsCount || 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Profissionais Ativos',
      value: staffCount || 0,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Receita Total',
      value: `R$ ${(revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminMetricsCards;
