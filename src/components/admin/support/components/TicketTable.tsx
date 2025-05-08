
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SupportTicket } from '@/types/support';
import TicketRow from './TicketRow';

interface TicketTableProps {
  tickets: SupportTicket[];
  onOpenTicket: (ticket: SupportTicket) => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
}

const TicketTable: React.FC<TicketTableProps> = ({ tickets, onOpenTicket, onStatusChange }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assunto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TicketRow 
              key={ticket.id}
              ticket={ticket}
              onOpenTicket={onOpenTicket}
              onStatusChange={onStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TicketTable;
