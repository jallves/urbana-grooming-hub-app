
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface AppointmentFormActionsProps {
  isLoading: boolean;
  onClose: () => void;
  isEditing: boolean;
}

const AppointmentFormActions: React.FC<AppointmentFormActionsProps> = ({ 
  isLoading, 
  onClose, 
  isEditing 
}) => {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Agendar'}
      </Button>
    </DialogFooter>
  );
};

export default AppointmentFormActions;
