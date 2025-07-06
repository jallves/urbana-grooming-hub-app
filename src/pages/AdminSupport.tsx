
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  client_id: string;
  staff_id: string;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    email?: string;
  };
  staff?: {
    name: string;
  };
}

const AdminSupport: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          clients (name, email),
          barbers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedTickets = data?.map(ticket => ({
        ...ticket,
        staff: ticket.barbers ? { name: (ticket.barbers as any).name } : undefined
      })) || [];

      setTickets(transformedTickets);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tickets de suporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'open': 'destructive',
      'in_progress': 'secondary',
      'resolved': 'default',
      'closed': 'default'
    };
    
    const labels: Record<string, string> = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'resolved': 'Resolvido',
      'closed': 'Fechado'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'low': 'default',
      'medium': 'secondary',
      'high': 'destructive',
      'urgent': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente'
    };

    return (
      <Badge variant={variants[priority] || 'default'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminRoute>
        <AdminLayout title="Suporte">
          <ModernCard className="w-full max-w-full bg-white border-gray-200">
            <div className="animate-pulse space-y-4 p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </ModernCard>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout title="Suporte">
        <ModernCard
          title="Gestão de Suporte"
          description="Gerencie tickets de suporte dos clientes"
          className="w-full max-w-full bg-white border-gray-200"
          contentClassName="overflow-hidden"
          headerActions={
            <Button onClick={() => navigate('/admin/support/new')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Ticket</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          }
        >
          <div className="w-full overflow-hidden">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum ticket encontrado
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Não há tickets de suporte registrados no momento.
                </p>
                <Button onClick={() => navigate('/admin/support/new')} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-gray-200"
                    onClick={() => navigate(`/admin/support/${ticket.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2 text-gray-900">
                          {ticket.subject}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {ticket.description}
                      </p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span className="text-gray-700">Cliente: {ticket.clients?.name || 'N/A'}</span>
                        </div>
                        
                        {ticket.staff && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="text-gray-700">Atribuído: {ticket.staff.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span className="text-gray-700">
                            {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ModernCard>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSupport;
