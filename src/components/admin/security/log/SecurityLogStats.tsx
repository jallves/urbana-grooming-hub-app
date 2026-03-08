import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Plus, Edit, Trash2, LogOut, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SecurityLog } from './securityLogTypes';
import { subDays, isAfter } from 'date-fns';

interface Props {
  logs: SecurityLog[];
  filteredLogs: SecurityLog[];
}

const SecurityLogStats: React.FC<Props> = ({ logs }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const thisWeek = logs.filter(l => isAfter(new Date(l.created_at), weekAgo));
    const lastWeek = logs.filter(l => {
      const d = new Date(l.created_at);
      return isAfter(d, twoWeeksAgo) && !isAfter(d, weekAgo);
    });

    const calcTrend = (action: string | string[]) => {
      const actions = Array.isArray(action) ? action : [action];
      const current = thisWeek.filter(l => actions.includes(l.action)).length;
      const previous = lastWeek.filter(l => actions.includes(l.action)).length;
      const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
      return { current, diff };
    };

    return [
      { ...calcTrend('view'), label: 'Visualizações', icon: Eye, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', accent: 'text-blue-900' },
      { ...calcTrend('create'), label: 'Criações', icon: Plus, bg: 'bg-green-50 border-green-200', text: 'text-green-700', accent: 'text-green-900' },
      { ...calcTrend('update'), label: 'Atualizações', icon: Edit, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', accent: 'text-amber-900' },
      { ...calcTrend('delete'), label: 'Exclusões', icon: Trash2, bg: 'bg-red-50 border-red-200', text: 'text-red-700', accent: 'text-red-900' },
      { ...calcTrend(['login', 'logout']), label: 'Sessões', icon: LogOut, bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', accent: 'text-purple-900' },
    ];
  }, [logs]);

  const TrendIcon = ({ diff }: { diff: number }) => {
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`${stat.bg} border overflow-hidden`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-1">
                <Icon className={`h-4 w-4 ${stat.text}`} />
                <div className="flex items-center gap-1">
                  <TrendIcon diff={stat.diff} />
                  <span className={`text-[10px] font-medium ${stat.diff > 0 ? 'text-green-600' : stat.diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {stat.diff > 0 ? '+' : ''}{stat.diff}%
                  </span>
                </div>
              </div>
              <p className={`text-2xl font-bold ${stat.accent}`}>{stat.current}</p>
              <p className={`text-[10px] ${stat.text} mt-0.5`}>{stat.label} (7 dias)</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SecurityLogStats;
