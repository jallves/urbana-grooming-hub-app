import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface TicketDetailsProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticketId,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Detalhes do Ticket</DialogTitle>
        </DialogHeader>
        
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Funcionalidade em desenvolvimento</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <p className="mb-2">
              O sistema de suporte com tickets requer a criação das tabelas <code className="bg-yellow-200 px-1 rounded">support_tickets</code> e <code className="bg-yellow-200 px-1 rounded">ticket_responses</code> no banco de dados.
            </p>
            <p className="text-sm">
              Esta funcionalidade será implementada em uma versão futura.
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetails;
