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
    <div className="space-y-4 w-full px-2 py-2 sm:space-y-6 sm:px-4 sm:py-4">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl text-black-900 dark:text-white">
          Gerenciamento de Clientes
        </h1>
        {!isAddingClient && !editingClient && (
          <Button 
            onClick={handleAddClient} 
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm sm:text-base">Novo Cliente</span>
          </Button>
        )}
      </div>

      {/* Form Section */}
      {(isAddingClient || editingClient) && (
        <Card className="bg-black dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="px-3 py-3 sm:px-4 sm:py-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-black-900 dark:text-white">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-2 sm:px-4 sm:py-4">
            <ClientForm 
              clientId={editingClient}
              onCancel={handleCancelForm}
              onSuccess={handleSuccess}
              compact={window.innerWidth < 640} // Pass compact prop for mobile
            />
          </CardContent>
        </Card>
      )}

      {/* Client List Section */}
      <div className="overflow-x-auto">
        <div className="min-w-[280px] sm:min-w-full">
          <ClientList 
            clients={clients || []}
            isLoading={isLoading}
            onEdit={handleEditClient}
            onDelete={() => refetch()}
            compactView={window.innerWidth < 640} // Pass compact prop for mobile
          />
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
