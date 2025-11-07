
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
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
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  if (error) {
    toast.error('Erro ao carregar clientes', {
      description: (error as Error).message
    });
  }

  return (
    <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile First */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="panel-title-responsive">Clientes</h1>
              <p className="panel-text-responsive text-muted-foreground">
                {clients?.length || 0} clientes cadastrados
              </p>
            </div>
          </div>
          
          {!isAddingClient && !editingClient && (
            <Button 
              onClick={() => setIsAddingClient(true)}
              className="panel-button-responsive"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Form Section - Responsivo */}
        {(isAddingClient || editingClient) && (
          <Card className="panel-card-responsive mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="panel-text-responsive">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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

      {/* Lista de Clientes */}
      <div className="w-full">
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
    </div>
  );
};

export default ClientManagement;
