
import React from 'react';
import { Button } from '@/components/ui/button';

interface ClientFormActionsProps {
  isLoading: boolean;
  onClose: () => void;
}

const ClientFormActions: React.FC<ClientFormActionsProps> = ({ 
  isLoading, 
  onClose 
}) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="bg-stone-700 border-stone-600 text-white hover:bg-stone-600"
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-amber-600 hover:bg-amber-700 text-black"
      >
        {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );
};

export default ClientFormActions;
