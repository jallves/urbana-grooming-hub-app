
import React from 'react';
import { MessageSquare } from 'lucide-react';

const EmptyTicketState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="mt-2 text-lg font-semibold">Nenhum ticket encontrado</h3>
      <p className="text-muted-foreground">Não há tickets de suporte para mostrar no momento.</p>
      <p className="mt-2 text-sm text-muted-foreground">Quando novos tickets forem criados, eles aparecerão aqui.</p>
    </div>
  );
};

export default EmptyTicketState;
