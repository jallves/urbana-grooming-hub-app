import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  size = 'md'
}) => {
  const variantClasses = {
    default: 'bg-card text-card-foreground border border-border',
    outline: 'border-2 border-border bg-transparent',
    ghost: 'border-none shadow-none bg-transparent'
  };

  const sizeClasses = {
    sm: {
      header: 'px-3 py-2',
      content: 'p-3',
      title: 'text-sm font-medium'
    },
    md: {
      header: 'px-4 py-3 sm:px-6 sm:py-4',
      content: 'p-4 sm:p-6',
      title: 'text-base sm:text-lg font-semibold'
    },
    lg: {
      header: 'px-6 py-4 sm:px-8 sm:py-6',
      content: 'p-6 sm:p-8',
      title: 'text-lg sm:text-xl font-bold'
    }
  };

  return (
    <Card className={cn(
      'w-full shadow-sm',
      variantClasses[variant],
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          sizeClasses[size].header,
          headerClassName
        )}>
          {title && (
            <CardTitle className={cn(
              sizeClasses[size].title,
              'truncate'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        sizeClasses[size].content,
        !title && !description && 'pt-4',
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ResponsiveCard;