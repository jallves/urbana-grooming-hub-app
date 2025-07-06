
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingClientState: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-between sm:items-center">
          <Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
          <Skeleton className="h-8 w-20 sm:h-9 sm:w-24" />
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3">
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
              <Skeleton className="h-4 w-32 sm:h-5 sm:w-40 hidden sm:block" />
              <Skeleton className="h-4 w-20 sm:h-5 sm:w-28" />
              <Skeleton className="h-4 w-20 sm:h-5 sm:w-28 hidden md:block" />
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-32 hidden lg:block" />
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-32 hidden xl:block" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingClientState;
