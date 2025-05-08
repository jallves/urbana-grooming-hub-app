
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TicketListHeaderProps {
  ticketCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

const TicketListHeader: React.FC<TicketListHeaderProps> = ({ 
  ticketCount, 
  onRefresh, 
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-muted-foreground">
        {ticketCount} tickets encontrados
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
  );
};

export default TicketListHeader;
