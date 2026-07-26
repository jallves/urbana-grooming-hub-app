
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientRecurrence from './ClientRecurrence';
import ClientRecent from './ClientRecent';

const ClientManagement: React.FC = () => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['painel-clients-with-last-appointment'],
    queryFn: async () => {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('painel_clientes')
        .select('*')
        .order('nome');
      
      if (clientsError) throw new Error(clientsError.message);
      if (!clientsData || clientsData.length === 0) return [];

      // Fetch last appointment for each client
      const clientIds = clientsData.map(c => c.id);
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select('cliente_id, data, hora, status')
        .in('cliente_id', clientIds)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      // Map last appointment per client
      const lastAppointmentMap = new Map<string, { data: string; hora: string; status: string | null }>();
      if (appointments) {
        for (const apt of appointments) {
          if (apt.cliente_id && !lastAppointmentMap.has(apt.cliente_id)) {
            lastAppointmentMap.set(apt.cliente_id, { data: apt.data, hora: apt.hora, status: apt.status });
          }
        }
      }

      return clientsData.map(client => ({
        ...client,
        ultimo_agendamento: lastAppointmentMap.get(client.id) || null,
      }));
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

      {/* Tabs: Lista / Recorrência / Recentes — cores fixas Costa Urbana (preto/dourado) */}
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-2 h-auto bg-transparent p-0">
          {/* Lista — preto com dourado */}
          <TabsTrigger
            value="lista"
            className="h-11 rounded-md border-2 border-[#c9a84c] bg-[#0d0d0d] text-[#f0d78c] font-semibold text-xs sm:text-sm data-[state=active]:bg-[#c9a84c] data-[state=active]:text-[#0d0d0d] data-[state=active]:border-[#c9a84c] data-[state=active]:shadow-md"
          >
            Lista de Clientes
          </TabsTrigger>
          {/* Recorrência — dourado sólido */}
          <TabsTrigger
            value="recorrencia"
            className="h-11 rounded-md border-2 border-[#8b7333] bg-[#c9a84c] text-[#0d0d0d] font-semibold text-xs sm:text-sm data-[state=active]:bg-[#f0d78c] data-[state=active]:text-[#0d0d0d] data-[state=active]:border-[#0d0d0d] data-[state=active]:shadow-md"
          >
            Recorrência
          </TabsTrigger>
          {/* Recém-cadastrados — vinho escuro com dourado */}
          <TabsTrigger
            value="recentes"
            className="h-11 rounded-md border-2 border-[#c9a84c] bg-[#5c1a1a] text-[#f0d78c] font-semibold text-xs sm:text-sm data-[state=active]:bg-[#8b2a2a] data-[state=active]:text-[#f0d78c] data-[state=active]:border-[#f0d78c] data-[state=active]:shadow-md"
          >
            Recém-cadastrados
          </TabsTrigger>
        </TabsList>

        <TabsContent key="lista" value="lista" className="mt-4">
          <ClientList
            clients={clients || []}
            isLoading={isLoading}
            onEdit={(id) => {
              setEditingClient(id);
              setIsAddingClient(false);
            }}
            onDelete={refetch}
          />
        </TabsContent>

        <TabsContent key="recorrencia" value="recorrencia" className="mt-4">
          <ClientRecurrence />
        </TabsContent>

        <TabsContent key="recentes" value="recentes" className="mt-4">
          <ClientRecent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientManagement;
