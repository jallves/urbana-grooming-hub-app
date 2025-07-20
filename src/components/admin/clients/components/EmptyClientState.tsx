
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';

const EmptyClientState: React.FC = () => {
  return (
    <Card className="panel-card-responsive">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="text-center space-y-6 max-w-md mx-auto">
          {/* Ícone principal */}
          <div className="mx-auto w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-gray-500" />
          </div>
          
          {/* Título e descrição */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">
              Nenhum cliente cadastrado
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Você ainda não possui clientes em sua base. Comece adicionando seu primeiro cliente para gerenciar sua carteira.
            </p>
          </div>
          
          {/* Dica visual */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6 p-3 bg-gray-800/30 rounded-lg">
            <UserPlus className="h-4 w-4" />
            <span>Clique em "Novo Cliente" para começar</span>
          </div>

          {/* Estatísticas vazias */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-urbana-gold">0</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-urbana-gold">0</div>
              <div className="text-xs text-gray-500">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-urbana-gold">0</div>
              <div className="text-xs text-gray-500">Este mês</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyClientState;
