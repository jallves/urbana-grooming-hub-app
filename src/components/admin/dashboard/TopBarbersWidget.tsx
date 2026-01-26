import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BarberStats {
  barber_id: string;
  barber_name: string;
  total_revenue: number;
  total_services: number;
  total_commissions: number;
  average_ticket: number;
}

const TopBarbersWidget: React.FC = () => {
  const { data: topBarbers, isLoading } = useQuery({
    queryKey: ['top-barbers-dashboard'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      // Fetch revenue records for the month
      const { data: revenueData } = await supabase
        .from('financial_records')
        .select('barber_id, net_amount')
        .eq('status', 'completed')
        .eq('transaction_type', 'revenue')
        .gte('transaction_date', firstDayOfMonth)
        .not('barber_id', 'is', null);

      // Fetch barber names from painel_barbeiros
      const { data: barbersData } = await supabase
        .from('painel_barbeiros')
        .select('id, nome')
        .eq('ativo', true);

      // Create a map of barber names
      const barberNames: Record<string, string> = {};
      barbersData?.forEach(barber => {
        barberNames[barber.id] = barber.nome;
      });

      // Aggregate by barber
      const barberMap = new Map<string, BarberStats>();

      revenueData?.forEach((record) => {
        const barberId = record.barber_id;
        const barberName = barberNames[barberId] || 'Barbeiro';
        
        if (!barberMap.has(barberId)) {
          barberMap.set(barberId, {
            barber_id: barberId,
            barber_name: barberName,
            total_revenue: 0,
            total_services: 0,
            total_commissions: 0,
            average_ticket: 0,
          });
        }

        const stats = barberMap.get(barberId)!;
        stats.total_revenue += record.net_amount || 0;
        stats.total_services += 1;
      });

      // Get commissions for each barber
      const { data: commissions } = await supabase
        .from('financial_records')
        .select('barber_id, net_amount')
        .eq('status', 'completed')
        .eq('transaction_type', 'commission')
        .gte('transaction_date', firstDayOfMonth)
        .not('barber_id', 'is', null);

      commissions?.forEach((comm) => {
        const stats = barberMap.get(comm.barber_id);
        if (stats) {
          stats.total_commissions += Math.abs(comm.net_amount || 0);
        }
      });

      // Calculate average ticket and sort
      const barberStats = Array.from(barberMap.values())
        .map(stats => ({
          ...stats,
          average_ticket: stats.total_services > 0 ? stats.total_revenue / stats.total_services : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      return barberStats;
    },
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold text-gray-900">
            Top 5 Barbeiros do Mês
          </CardTitle>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Ranking por faturamento total
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topBarbers?.map((barber, index) => (
            <div 
              key={barber.barber_id}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}º
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {barber.barber_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {barber.barber_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {barber.total_services} serviços • Ticket médio: R$ {barber.average_ticket.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  R$ {barber.total_revenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Com.: R$ {barber.total_commissions.toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {(!topBarbers || topBarbers.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum dado disponível este mês</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopBarbersWidget;
