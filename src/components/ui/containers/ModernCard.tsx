
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
  gradient?: string;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  headerActions,
  gradient = 'from-black/40 to-gray-900/40'
}) => {
  return (
    <Card className={cn(
      'bg-white border border-gray-200 shadow-lg w-full max-w-full overflow-hidden',
      className
    )}>
      {(title || description || headerActions) && (
        <CardHeader className={cn(
          'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between px-4 py-4 lg:px-6 lg:py-6 pb-4',
          headerClassName
        )}>
          <div className="space-y-1 w-full sm:flex-1 min-w-0">
            {title && (
              <CardTitle className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-end flex-shrink-0">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        'p-4 lg:p-6 w-full max-w-full',
        contentClassName
      )}>
        <div className="w-full max-w-full overflow-hidden">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernCard;
