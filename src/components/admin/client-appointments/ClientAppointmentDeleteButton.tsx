import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientAppointmentDeleteButtonProps {
  appointmentId: string;
  clientName: string;
  hasCheckIn: boolean;
  onDeleted: () => void;
}

export const ClientAppointmentDeleteButton: React.FC<ClientAppointmentDeleteButtonProps> = ({
  appointmentId,
  clientName,
  hasCheckIn,
  onDeleted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (hasCheckIn) {
      toast.error('Não é possível excluir', {
        description: 'Este agendamento possui check-in. Não pode ser excluído.'
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Deletar agendamento
      const { error } = await supabase
        .from('painel_agendamentos')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Agendamento excluído', {
        description: `Cliente ${clientName} não compareceu`
      });

      setIsOpen(false);
      onDeleted();
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (hasCheckIn) {
    return null; // Não mostrar botão se tem check-in
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Cliente <strong>{clientName}</strong> não compareceu para o atendimento?
              <br /><br />
              Esta ação não pode ser desfeita. O agendamento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
