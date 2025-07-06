
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmptyClientState: React.FC = () => {
  return (
    <Card className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600">
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6">
        <div className="text-center space-y-4 sm:space-y-6 max-w-sm mx-auto">
          {/* Ícone principal */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500" />
          </div>
          
          {/* Título */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Nenhum cliente encontrado
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Você ainda não possui clientes cadastrados. Comece adicionando seu primeiro cliente para gerenciar sua base de dados.
            </p>
          </div>
          
          {/* Dica visual */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-4">
            <UserPlus className="h-4 w-4" />
            <span>Clique em "Novo Cliente" para começar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyClientState;
