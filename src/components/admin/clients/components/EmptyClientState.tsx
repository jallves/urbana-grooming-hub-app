
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const EmptyClientState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Cliente" para adicionar</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyClientState;
