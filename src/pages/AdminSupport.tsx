
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketList from '../components/admin/support/TicketList';
import TicketStats from '../components/admin/support/TicketStats';
import KnowledgeBase from '../components/admin/support/KnowledgeBase';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket } from '@/types/support';
import { toast } from 'sonner';

const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('tickets');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, clients(name, email), staff(name)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Não foi possível carregar os tickets de suporte');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status } : ticket
      ));
      
      toast.success(`Status do ticket atualizado para ${status}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Não foi possível atualizar o status do ticket');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Suporte e Ajuda</h1>
          <p className="text-gray-500">Central de atendimento e tutoriais</p>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="kb">Base de Conhecimento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tickets de Suporte</CardTitle>
                <CardDescription>
                  Visualize e gerencie os tickets de suporte dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketList 
                  tickets={tickets} 
                  isLoading={isLoading} 
                  onRefresh={fetchTickets}
                  onStatusChange={updateTicketStatus}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Suporte</CardTitle>
                <CardDescription>
                  Visualize métricas e desempenho da equipe de suporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketStats tickets={tickets} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kb">
            <Card>
              <CardHeader>
                <CardTitle>Base de Conhecimento</CardTitle>
                <CardDescription>
                  Artigos e tutoriais para ajudar os clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KnowledgeBase />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
