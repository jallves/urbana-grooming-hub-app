
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Target } from 'lucide-react';

const MarketingDashboard: React.FC = () => {
  // Mock data for metrics
  const metrics = [
    {
      title: 'Campanhas Ativas',
      value: '5',
      change: '+2 este mês',
      icon: Target,
      color: 'text-blue-400'
    },
    {
      title: 'Cupons Utilizados',
      value: '127',
      change: '+15% vs mês anterior',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      title: 'Novos Clientes',
      value: '48',
      change: '+7% esta semana',
      icon: Users,
      color: 'text-purple-400'
    },
    {
      title: 'Receita Marketing',
      value: 'R$ 12.450',
      change: '+23% este mês',
      icon: DollarSign,
      color: 'text-yellow-400'
    }
  ];

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
      value: '15% de desconto'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-gray-400">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold text-white">{metric.value}</div>
              <p className="text-xs text-gray-500">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start justify-between py-1">
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{activity.event}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <div className="text-xs text-gray-400 text-right">
                {activity.value}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/relatorios" className="flex items-center text-xs">
            <BarChart3 className="h-3 w-3 mr-2" />
            Ver Relatórios Completos
          </a>
        </Button>
      </div>
    </div>
  );
};

export default MarketingDashboard;
