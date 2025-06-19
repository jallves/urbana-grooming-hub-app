
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react';

interface AppointmentFormActionsProps {
  isLoading: boolean;
  onCancel: () => void;
  isEditing?: boolean;
}

const AppointmentFormActions: React.FC<AppointmentFormActionsProps> = ({
  isLoading,
  onCancel,
  isEditing = false
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
      
      <Button
        type="submit"
        className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isEditing ? 'Atualizando...' : 'Agendando...'}
          </>
        ) : (
          <>
            <Calendar className="mr-2 h-5 w-5" />
            {isEditing ? 'Atualizar Agendamento' : 'Confirmar Agendamento'}
          </>
        )}
      </Button>
    </div>
  );
};

export default AppointmentFormActions;
