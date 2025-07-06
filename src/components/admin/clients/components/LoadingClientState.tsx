
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingClientState: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-between sm:items-center sm:mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-full sm:h-9 sm:w-24" />
        </div>
        
        {/* Table header skeleton */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 pb-3">
            <Skeleton className="h-4 w-20 sm:w-32" />
            <Skeleton className="h-4 w-24 sm:w-40 hidden sm:block" />
            <Skeleton className="h-4 w-20 sm:w-28" />
            <Skeleton className="h-4 w-20 sm:w-28 hidden md:block" />
            <Skeleton className="h-4 w-24 sm:w-32 hidden lg:block" />
            <Skeleton className="h-4 w-24 sm:w-32 hidden xl:block" />
            <div className="ml-auto">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        
        {/* Table rows skeleton */}
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              {/* Nome */}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[120px] mb-1" />
                <div className="sm:hidden">
                  <Skeleton className="h-3 w-full max-w-[100px]" />
                </div>
              </div>
              
              {/* Email - hidden on mobile */}
              <div className="hidden sm:block flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[140px]" />
              </div>
              
              {/* Telefone */}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[100px]" />
              </div>
              
              {/* WhatsApp - hidden on mobile/tablet */}
              <div className="hidden md:block flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[100px]" />
              </div>
              
              {/* Birth date - hidden until desktop */}
              <div className="hidden lg:block flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[110px]" />
              </div>
              
              {/* Created date - hidden until xl */}
              <div className="hidden xl:block flex-1 min-w-0">
                <Skeleton className="h-4 w-full max-w-[110px]" />
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll hint skeleton */}
        <div className="mt-4 text-center sm:hidden">
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingClientState;
