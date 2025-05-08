
import React, { useState } from 'react';
import { SupportTicket } from '@/types/support';
import TicketDetails from './TicketDetails';
import TicketListHeader from './components/TicketListHeader';
import TicketTable from './components/TicketTable';
import LoadingState from './components/LoadingState';
import EmptyTicketState from './components/EmptyTicketState';

interface TicketListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  onRefresh: () => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, isLoading, onRefresh, onStatusChange }) => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket.id);
    setShowTicketDetails(true);
  };

  const handleCloseTicket = () => {
    setShowTicketDetails(false);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await onStatusChange(ticketId, newStatus);
  };

  return (
    <>
      <TicketListHeader 
        ticketCount={tickets.length} 
        onRefresh={onRefresh} 
        isLoading={isLoading} 
      />

      {isLoading ? (
        <LoadingState />
      ) : tickets.length === 0 ? (
        <EmptyTicketState />
      ) : (
        <TicketTable 
          tickets={tickets}
          onOpenTicket={handleOpenTicket}
          onStatusChange={handleStatusChange}
        />
      )}

      {selectedTicket && (
        <TicketDetails
          ticketId={selectedTicket}
          isOpen={showTicketDetails}
          onClose={handleCloseTicket}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
};

export default TicketList;
