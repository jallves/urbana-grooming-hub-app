
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  gradient?: string;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  description,
  children,
  className,
  headerActions,
  gradient = 'from-black/40 to-gray-900/40'
}) => {
  return (
    <Card className={cn(
      'bg-gradient-to-br backdrop-blur-lg border border-white/10 shadow-2xl',
      gradient,
      className
    )}>
      {(title || description || headerActions) && (
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
          <div className="space-y-1 w-full sm:w-auto">
            {title && (
              <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-gray-400 text-xs sm:text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="p-3 sm:p-4 md:p-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;
