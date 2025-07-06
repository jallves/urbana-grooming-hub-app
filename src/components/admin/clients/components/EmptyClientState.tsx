
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

const EmptyClientState: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16">
        <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
        <h3 className="text-base font-semibold mb-2 sm:text-lg">Nenhum cliente encontrado</h3>
        <p className="text-xs text-gray-500 text-center sm:text-sm">
          Clique em "Novo Cliente" para adicionar o primeiro cliente
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyClientState;
