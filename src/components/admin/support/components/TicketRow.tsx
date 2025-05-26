
import React from 'react';
import { format } from 'date-fns';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportTicket } from '@/types/support';
import { getStatusBadge, getPriorityBadge } from '../utils/statusUtils';

interface TicketRowProps {
  ticket: SupportTicket;
  onOpenTicket: (ticket: SupportTicket) => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, onOpenTicket, onStatusChange }) => {
  // Garantir que o status nunca seja uma string vazia
  const ticketStatus = ticket.status || 'open';
  
  return (
    <TableRow>
      <TableCell className="font-medium">{ticket.subject}</TableCell>
      <TableCell>
        {ticket.client_id ? (
          // @ts-ignore - Relações não estão no tipo base
          ticket.clients?.name || 'Cliente não encontrado'
        ) : (
          'Cliente não registrado'
        )}
      </TableCell>
      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
      <TableCell>{getStatusBadge(ticketStatus)}</TableCell>
      <TableCell>
        {ticket.created_at && format(new Date(ticket.created_at), 'dd/MM/yyyy')}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenTicket(ticket)}
          >
            Ver
          </Button>
          <Select
            value={ticketStatus}
            onValueChange={async (value) => await onStatusChange(ticket.id, value)}
          >
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TicketRow;
