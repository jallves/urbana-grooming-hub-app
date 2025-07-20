
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Clock, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';

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
      <Badge variant={variants[status] || 'default'} className="text-xs">
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
      <Badge variant={variants[priority] || 'default'} className="text-xs">
        {labels[priority] || priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminRoute>
        <AdminLayout title="Suporte">
          <div className="w-full h-full bg-black text-white overflow-hidden">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout title="Suporte">
        <div className="w-full h-full bg-black text-white overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white">Gestão de Suporte</h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Gerencie tickets de suporte dos clientes</p>
                </div>
                <Button 
                  onClick={() => navigate('/admin/support/new')} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 h-auto"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Novo Ticket</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Nenhum ticket encontrado
                  </h3>
                  <p className="text-xs text-gray-600 text-center mb-4">
                    Não há tickets de suporte registrados no momento.
                  </p>
                  <Button 
                    onClick={() => navigate('/admin/support/new')} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Ticket
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tickets.map((ticket) => (
                    <Card 
                      key={ticket.id} 
                      className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/support/${ticket.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium text-white line-clamp-2 flex-1">
                            {ticket.subject}
                          </CardTitle>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-gray-400 line-clamp-3">
                          {ticket.description}
                        </p>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span className="text-gray-300">{ticket.clients?.name || 'N/A'}</span>
                          </div>
                          
                          {ticket.staff && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <User className="w-3 h-3" />
                              <span className="text-gray-300">Atribuído: {ticket.staff.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-gray-300">
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
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSupport;
