
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SupportTicket, TicketResponse } from '@/types/support';
import { toast } from 'sonner';

interface TicketDetailsProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticketId,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails();
      
      // Set up real-time subscription for ticket responses
      const channel = supabase
        .channel('ticket-response-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ticket_responses',
            filter: `ticket_id=eq.${ticketId}`
          },
          (payload) => {
            console.log('Ticket response changed:', payload);
            fetchTicketDetails(); // Refresh data when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    
    setIsLoading(true);
    try {
      // Fetch ticket details
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*, clients(*), staff(*)')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Fetch ticket responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('ticket_responses')
        .select('*, staff(*)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (responsesError) throw responsesError;

      setTicket(ticketData);
      setResponses(responsesData || []);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Erro ao carregar detalhes do ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!ticketId || !newResponse.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Get current user (staff) info - in a real app, this would come from auth
      // For now we're hardcoding a staff ID
      const staffId = '1'; // Replace with actual staff ID from auth
      
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          responder_id: staffId,
          responder_type: 'staff',
          response_text: newResponse,
        });

      if (error) throw error;

      // Update ticket status to "in_progress" if it was "open"
      if (ticket?.status === 'open') {
        await onStatusChange(ticketId, 'in_progress');
      }

      setNewResponse('');
      toast.success('Resposta enviada com sucesso');
      fetchTicketDetails();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Aberto</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !ticket ? (
          <div className="text-center py-8">
            <p>Ticket não encontrado ou foi removido.</p>
            <Button onClick={onClose} className="mt-4">Fechar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">Ticket #{ticket.id}</DialogTitle>
                {getStatusBadge(ticket.status)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Criado em {formatDate(ticket.created_at)}
              </div>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Assunto: {ticket.subject}</h3>
                  <span className="text-sm text-muted-foreground">
                    Cliente: {(ticket as any).clients?.name || 'Desconhecido'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
              
              <div className="space-y-4 mt-6">
                <h3 className="font-medium">Histórico de Respostas</h3>
                
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhuma resposta ainda.</p>
                ) : (
                  responses.map((response) => (
                    <div key={response.id} className="bg-muted/50 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          {(response as any).staff?.name || 'Atendente'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(response.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{response.response_text}</p>
                    </div>
                  ))
                )}
              </div>
              
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <div className="space-y-3 mt-6">
                  <label htmlFor="response" className="block text-sm font-medium">
                    Adicionar Resposta
                  </label>
                  <Textarea
                    id="response"
                    rows={4}
                    placeholder="Digite sua resposta aqui..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="flex space-x-2 justify-end">
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <Button 
                  onClick={handleSubmitResponse} 
                  disabled={!newResponse.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
              )}
              
              {ticket.status === 'open' || ticket.status === 'in_progress' ? (
                <Button 
                  variant="outline" 
                  onClick={() => onStatusChange(ticket.id, 'resolved')}
                >
                  Marcar como Resolvido
                </Button>
              ) : ticket.status === 'resolved' ? (
                <Button 
                  variant="outline" 
                  onClick={() => onStatusChange(ticket.id, 'closed')}
                >
                  Fechar Ticket
                </Button>
              ) : null}
              
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetails;
