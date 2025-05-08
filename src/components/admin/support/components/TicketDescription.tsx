
import React from 'react';
import { SupportTicket } from '@/types/support';

interface TicketDescriptionProps {
  ticket: SupportTicket;
}

const TicketDescription: React.FC<TicketDescriptionProps> = ({ ticket }) => {
  return (
    <div className="bg-muted p-4 rounded-md">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium">Assunto: {ticket.subject}</h3>
        <span className="text-sm text-muted-foreground">
          Cliente: {(ticket as any).clients?.name || 'Desconhecido'}
        </span>
      </div>
      <p className="whitespace-pre-wrap">{ticket.description}</p>
    </div>
  );
};

export default TicketDescription;
