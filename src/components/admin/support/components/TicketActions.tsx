
import React from 'react';
import { Button } from '@/components/ui/button';

interface TicketActionsProps {
  ticketStatus: string;
  onClose: () => void;
  onStatusChange: (status: string) => Promise<void>;
  ticketId: string;
}

const TicketActions: React.FC<TicketActionsProps> = ({ 
  ticketStatus,
  onClose,
  onStatusChange,
  ticketId
}) => {
  return (
    <div className="flex space-x-2 justify-end">
      {ticketStatus === 'open' || ticketStatus === 'in_progress' ? (
        <Button 
          variant="outline" 
          onClick={() => onStatusChange('resolved')}
        >
          Marcar como Resolvido
        </Button>
      ) : ticketStatus === 'resolved' ? (
        <Button 
          variant="outline" 
          onClick={() => onStatusChange('closed')}
        >
          Fechar Ticket
        </Button>
      ) : null}
      
      <Button variant="ghost" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};

export default TicketActions;
