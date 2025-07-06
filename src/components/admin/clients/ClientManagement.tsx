
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
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-2 p-2 sm:space-y-3 sm:p-3 md:space-y-4 md:p-4">
        {/* Header Section - Responsivo */}
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold sm:text-base md:text-lg lg:text-xl xl:text-2xl text-black-900 dark:text-white truncate">
              Gerenciamento de Clientes
            </h1>
          </div>
          {!isAddingClient && !editingClient && (
            <div className="flex-shrink-0">
              <Button 
                onClick={handleAddClient} 
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Novo Cliente</span>
              </Button>
            </div>
          )}
        </div>

        {/* Form Section - Responsivo */}
        {(isAddingClient || editingClient) && (
          <Card className="w-full bg-black dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
              <CardTitle className="text-sm font-bold sm:text-base md:text-lg lg:text-xl text-black-900 dark:text-white">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3">
              <ClientForm 
                clientId={editingClient}
                onCancel={handleCancelForm}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        )}

        {/* Client List Section - Responsivo */}
        <div className="w-full overflow-hidden">
          <ClientList 
            clients={clients || []}
            isLoading={isLoading}
            onEdit={handleEditClient}
            onDelete={() => refetch()}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
