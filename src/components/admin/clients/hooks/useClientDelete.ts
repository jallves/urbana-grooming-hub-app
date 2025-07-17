
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  nome?: string;
  name?: string;
}

export const useClientDelete = (onDelete: () => void) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('painel_clientes')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      const clientName = clientToDelete.nome || clientToDelete.name || 'Cliente';
      toast.success(`${clientName} foi excluído com sucesso`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      onDelete();
    } catch (error) {
      toast.error('Erro ao excluir cliente', {
        description: (error as Error).message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    clientToDelete,
    isDeleting,
    handleDelete,
    confirmDelete
  };
};
