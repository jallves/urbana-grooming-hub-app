
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            ) : value}
          </div>
          {trend ? (
            <Badge variant="outline" className={`text-${trend.direction === 'up' ? 'green' : 'red'}-600`}>
              {trend.direction === 'up' ? (
                <ArrowUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 mr-1" />
              )}
              {trend.value}
            </Badge>
          ) : (
            <div className="p-2 bg-primary/10 rounded-full">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {isLoading ? (
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              description
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
