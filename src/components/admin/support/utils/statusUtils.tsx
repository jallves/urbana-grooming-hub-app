
import React from 'react';
import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge variant="destructive">Aberto</Badge>;
    case 'in_progress':
      return <Badge variant="secondary">Em Progresso</Badge>;
    case 'resolved':
      return <Badge variant="success">Resolvido</Badge>;
    case 'closed':
      return <Badge variant="outline">Fechado</Badge>;
    default:
      return <Badge>Desconhecido</Badge>;
  }
};

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low':
      return <Badge variant="outline">Baixa</Badge>;
    case 'medium':
      return <Badge variant="secondary">Média</Badge>;
    case 'high':
      return <Badge variant="destructive">Alta</Badge>;
    case 'critical':
      return <Badge className="bg-red-600">Crítica</Badge>;
    default:
      return <Badge>Normal</Badge>;
  }
};
