
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingClientState: React.FC = () => {
  return (
    <Card className="panel-card-responsive">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="mx-auto w-12 h-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          </div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              Carregando clientes...
            </h3>
            <p className="text-sm text-gray-400">
              Aguarde enquanto buscamos os dados
            </p>
          </div>

          {/* Loading Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-4 space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-8 w-8 bg-gray-700 rounded"></div>
                    <div className="h-8 w-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingClientState;
