
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SupportTicket } from '@/types/support';
import { DialogTitle } from '@/components/ui/dialog';

interface TicketHeaderProps {
  ticket: SupportTicket;
  formatDate: (dateString: string) => string;
}

const TicketHeader: React.FC<TicketHeaderProps> = ({ ticket, formatDate }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Aberto</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <DialogTitle className="text-xl">Ticket #{ticket.id}</DialogTitle>
      {getStatusBadge(ticket.status)}
      <div className="mt-2 text-sm text-muted-foreground">
        Criado em {formatDate(ticket.created_at)}
      </div>
    </div>
  );
};

export default TicketHeader;
