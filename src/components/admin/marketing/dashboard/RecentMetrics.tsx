
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

interface MetricItem {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

interface RecentMetricsProps {
  metrics: MetricItem[];
}

import { ArrowUp, ArrowDown } from 'lucide-react';

const RecentMetrics: React.FC<RecentMetricsProps> = ({ metrics }) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Métricas Recentes</CardTitle>
        <CardDescription>Visão geral de desempenho dos últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((item, index) => (
            <div key={index} className="border rounded-md p-3">
              <div className="text-sm text-muted-foreground">{item.metric}</div>
              <div className="text-xl font-bold mt-1">{item.value}</div>
              <div className={`text-xs mt-1 flex items-center ${
                item.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentMetrics;
