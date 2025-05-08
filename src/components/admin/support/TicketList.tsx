
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupportTicket } from '@/types/support';
import { format } from 'date-fns';
import { MessageSquare, RefreshCw } from 'lucide-react';
import TicketDetails from './TicketDetails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TicketListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  onRefresh: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, isLoading, onRefresh, onStatusChange }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleCloseTicket = () => {
    setShowTicketDetails(false);
  };

  const getStatusBadge = (status: string) => {
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
  
  const getPriorityBadge = (priority: string) => {
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

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    onStatusChange(ticketId, newStatus);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {tickets.length} tickets encontrados
        </div>
        <Button
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-2 text-lg font-semibold">Nenhum ticket encontrado</h3>
          <p className="text-muted-foreground">Não há tickets de suporte para mostrar no momento.</p>
        </div>
      ) : (
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
                <TableRow key={ticket.id}>
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
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    {ticket.created_at && format(new Date(ticket.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTicket(ticket)}
                      >
                        Ver
                      </Button>
                      <Select
                        defaultValue={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          open={showTicketDetails}
          onClose={handleCloseTicket}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
};

export default TicketList;
