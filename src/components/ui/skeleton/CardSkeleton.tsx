import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
  hasHeader?: boolean;
  rows?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  hasHeader = true, 
  rows = 3 
}) => {
  return (
    <Card>
      {hasHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
