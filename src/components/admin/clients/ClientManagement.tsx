
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
          refetch();
        }
      )
      .subscribe();

    toast.success('Sistema de clientes inicializado', {
      description: 'Você pode criar, editar e visualizar clientes livremente'
    });

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
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Gerenciamento de Clientes</h1>
        {!isAddingClient && !editingClient && (
          <Button onClick={handleAddClient} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        )}
      </div>

      {(isAddingClient || editingClient) && (
        <Card className="bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-lg border border-white/10">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
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
