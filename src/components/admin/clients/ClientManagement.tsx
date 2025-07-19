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
    queryKey: ['painel-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('*')
        .order('nome');
      
      if (error) throw new Error(error.message);
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('painel-client-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'painel_clientes' },
        () => {
          toast.info('Dados de clientes atualizados');
          refetch();
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

  return (
    <div className="h-full flex flex-col space-y-6 bg-gray-50 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex-shrink-0 w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Gerenciamento de Clientes
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Gerencie sua base de clientes
            </p>
          </div>
          
          {!isAddingClient && !editingClient && (
            <Button 
              onClick={() => setIsAddingClient(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Form Section */}
        {(isAddingClient || editingClient) && (
          <Card className="mt-6 bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 text-base sm:text-lg">
                {editingClient ? 'Editar Cliente' : 'Adicionar Cliente'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ClientForm 
                clientId={editingClient}
                onCancel={() => {
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
                onSuccess={() => {
                  refetch();
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="flex-1 flex flex-col bg-white border border-gray-200 shadow-sm w-full max-w-7xl mx-auto">
        <CardHeader className="flex-shrink-0 pb-4 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Lista de Clientes
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-auto">
            <ClientList 
              clients={clients || []}
              isLoading={isLoading}
              onEdit={(id) => {
                setEditingClient(id);
                setIsAddingClient(false);
              }}
              onDelete={refetch}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManagement;
