import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
  gradient?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  headerActions,
  gradient = false
}) => {
  return (
    <Card className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-full overflow-hidden',
      gradient && 'bg-gradient-to-br from-white to-gray-50',
      className
    )}>
      {(title || description || headerActions) && (
        <CardHeader className={cn(
          'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200',
          headerClassName
        )}>
          <div className="space-y-1 w-full sm:flex-1 min-w-0">
            {title && (
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-gray-600 text-xs sm:text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        'p-4 sm:p-5 w-full max-w-full',
        contentClassName
      )}>
        <div className="w-full max-w-full overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernCard;