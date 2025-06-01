
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';

export const useClientDelete = (onDelete: () => void) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);
      
      if (error) throw error;
      
      toast.success('Cliente removido com sucesso!');
      onDelete();
    } catch (error) {
      toast.error('Erro ao remover cliente', {
        description: (error as Error).message
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const confirmDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
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
