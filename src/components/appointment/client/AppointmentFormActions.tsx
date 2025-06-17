
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

interface AppointmentFormActionsProps {
  isLoading: boolean;
  onCancel?: () => void;
  isEditing?: boolean;
}

const AppointmentFormActions: React.FC<AppointmentFormActionsProps> = ({ 
  isLoading, 
  onCancel,
  isEditing = false
}) => {
  return (
    <div className="flex justify-between gap-4 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="text-white border-stone-600 hover:bg-stone-700"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        className="bg-urbana-gold hover:bg-urbana-600 text-black font-semibold px-8 py-3 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader size="sm" />
            {isEditing ? 'Atualizando...' : 'Agendando...'}
          </span>
        ) : (
          isEditing ? 'Atualizar Agendamento' : 'Confirmar Agendamento'
        )}
      </Button>
    </div>
  );
};

export default AppointmentFormActions;
