
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
      <AdminLayout 
        title="Gestão de Suporte" 
        description="Gerencie tickets de suporte dos clientes"
        icon="💬"
      >
        <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-urbana-gold"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Gestão de Suporte" 
      description="Gerencie tickets de suporte dos clientes"
      icon="💬"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-end mb-4 sm:mb-6">
            <Button
                onClick={() => navigate('/admin/support/new')} 
                size="sm" 
                className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 text-xs px-3 py-1.5 h-auto shadow-md"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Novo Ticket</span>
                <span className="sm:hidden">Novo</span>
              </Button>
          </div>

          {/* Content */}
          <div className="w-full">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Nenhum ticket encontrado
                </h3>
                <p className="text-xs text-gray-500 text-center mb-4">
                  Não há tickets de suporte registrados no momento.
                </p>
                <Button 
                  onClick={() => navigate('/admin/support/new')} 
                  size="sm"
                  className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 shadow-md"
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
                    className="bg-white border-gray-200 hover:border-urbana-gold/50 transition-colors cursor-pointer shadow-sm"
                    onClick={() => navigate(`/admin/support/${ticket.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                          {ticket.subject}
                        </CardTitle>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {ticket.description}
                      </p>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span className="text-gray-700">{ticket.clients?.name || 'N/A'}</span>
                        </div>
                        
                        {ticket.staff && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span className="text-gray-700">Atribuído: {ticket.staff.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
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
        </div>
      </AdminLayout>
    );
  };

export default AdminSupport;
