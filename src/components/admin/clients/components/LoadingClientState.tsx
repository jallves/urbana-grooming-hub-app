
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const LoadingClientState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando clientes...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingClientState;
