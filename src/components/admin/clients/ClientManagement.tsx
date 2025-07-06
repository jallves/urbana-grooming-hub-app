import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useWindowSize } from '@/hooks/useWindowSize';

const ClientManagement: React.FC = () => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 640;

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw new Error(error.message);
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('client-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          toast.info('Dados de clientes atualizados');
          refetch();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [refetch]);

  if (error) {
    toast.error('Erro ao carregar clientes', {
      description: (error as Error).message
    });
  }

  return (
    <div className="w-full p-2 sm:p-4">
      {/* Header Section */}
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold sm:text-xl text-gray-900 dark:text-white">
          Gerenciamento de Clientes
        </h1>
        
        {!isAddingClient && !editingClient && (
          <Button 
            onClick={() => setIsAddingClient(true)}
            size={isMobile ? 'sm' : 'default'}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Form Section */}
      {(isAddingClient || editingClient) && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              {editingClient ? 'Editar Cliente' : 'Adicionar Cliente'}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              compact={isMobile}
            />
          </CardContent>
        </Card>
      )}

      {/* Client List Section */}
      <div className="overflow-hidden rounded-lg border">
        <ClientList 
          clients={clients || []}
          isLoading={isLoading}
          onEdit={(id) => {
            setEditingClient(id);
            setIsAddingClient(false);
          }}
          onDelete={refetch}
          compactView={isMobile}
        />
      </div>
    </div>
  );
};

export default ClientManagement;
