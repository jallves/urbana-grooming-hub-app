
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suporte</h1>
          <p className="text-gray-600">Gerencie tickets de suporte dos clientes</p>
        </div>
        <Button onClick={() => navigate('/admin/support/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum ticket encontrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Não há tickets de suporte registrados no momento.
            </p>
            <Button onClick={() => navigate('/admin/support/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/admin/support/${ticket.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {ticket.subject}
                  </CardTitle>
                  <div className="flex gap-2">
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
                    <span>Cliente: {ticket.clients?.name || 'N/A'}</span>
                  </div>
                  
                  {ticket.staff && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>Atribuído: {ticket.staff.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
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
  );
};

export default AdminSupport;
