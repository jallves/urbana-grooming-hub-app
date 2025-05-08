
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const ClientManagement: React.FC = () => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    }
  });

  // Set up real-time subscription for clients
  useEffect(() => {
    const channel = supabase
      .channel('client-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'clients'
        },
        (payload) => {
          console.log('Client data changed:', payload);
          toast.info('Dados de clientes atualizados');
          refetch(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (error) {
    toast.error('Erro ao carregar clientes', {
      description: (error as Error).message
    });
  }

  const handleAddClient = () => {
    setEditingClient(null);
    setIsAddingClient(true);
  };

  const handleEditClient = (id: string) => {
    setIsAddingClient(false);
    setEditingClient(id);
  };

  const handleCancelForm = () => {
    setIsAddingClient(false);
    setEditingClient(null);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddingClient(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Clientes</h1>
        {!isAddingClient && !editingClient && (
          <Button onClick={handleAddClient}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        )}
      </div>

      {(isAddingClient || editingClient) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm 
              clientId={editingClient}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      )}

      <ClientList 
        clients={clients || []}
        isLoading={isLoading}
        onEdit={handleEditClient}
        onDelete={() => refetch()}
      />
    </div>
  );
};

export default ClientManagement;
