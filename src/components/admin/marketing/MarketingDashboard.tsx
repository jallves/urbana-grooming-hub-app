
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import MetricsSection from './dashboard/MetricsSection';
import RecentMetrics from './dashboard/RecentMetrics';
import ActivityList from './dashboard/ActivityList';
import type { MetricItem } from './dashboard/RecentMetrics';

const MarketingDashboard: React.FC = () => {
  // Mock data for recent metrics
  const recentMetrics = [
    {
      metric: 'Visualizações da Loja',
      value: '2.350',
      change: '+15%',
      trend: 'up' as const
    },
    {
      metric: 'Novos Clientes',
      value: '48',
      change: '+7%',
      trend: 'up' as const
    },
    {
      metric: 'Taxa de Conversão',
      value: '3.2%',
      change: '-0.5%',
      trend: 'down' as const
    },
    {
      metric: 'Valor Médio',
      value: 'R$ 185,30',
      change: '+12%',
      trend: 'up' as const
    },
  ] as const;

  // Mock recent activities
  const recentActivities = [
    {
      event: 'Cupom BEMVINDO20 utilizado',
      time: '2 horas atrás',
      value: 'R$ 78,50 de desconto'
    },
    {
      event: 'Campanha "Dia das Mães" iniciada',
      time: '1 dia atrás',
      value: '12 produtos em promoção'
    },
    {
      event: 'Novo cliente cadastrado',
      time: '1 dia atrás',
      value: 'Via campanha de Instagram'
    },
    {
      event: 'Cupom ANIVERSARIO15 criado',
      time: '2 dias atrás',
      value: '15% de desconto em todos produtos'
    }
  ];

  return (
    <div className="space-y-6">
      <MetricsSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentMetrics metrics={recentMetrics} />
        <ActivityList activities={recentActivities} />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <a href="/admin/relatorios" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Relatórios Completos
          </a>
        </Button>
      </div>
    </div>
  );
};

export default MarketingDashboard;
