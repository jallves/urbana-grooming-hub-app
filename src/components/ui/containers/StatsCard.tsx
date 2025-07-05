
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'from-blue-500 to-purple-600',
  className
}) => {
  return (
    <Card className={cn(
      'bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-lg border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105',
      className
    )}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-gray-400 text-xs font-medium truncate">{title}</p>
            <div className="space-y-1">
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">{value}</p>
              {subtitle && (
                <p className="text-gray-500 text-xs truncate">{subtitle}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center space-x-1">
                <span className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline">vs. mês anterior</span>
              </div>
            )}
          </div>
          
          <div className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3',
            gradient
          )}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
