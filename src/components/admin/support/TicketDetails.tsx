
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { SupportTicket, TicketResponse } from '@/types/support';
import { toast } from 'sonner';

// Import our new components
import TicketHeader from './components/TicketHeader';
import TicketDescription from './components/TicketDescription';
import ResponseList from './components/ResponseList';
import ResponseForm from './components/ResponseForm';
import TicketActions from './components/TicketActions';
import { formatDate, getResponderName } from './utils/ticketUtils';

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
        .select(`
          *,
          clients(*),
          barbers:staff_id(*)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Fetch ticket responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (responsesError) throw responsesError;

      // Convert the response data to the expected type
      const typedResponses: TicketResponse[] = responsesData.map(response => ({
        ...response,
        // We'll handle staff names via UI instead of relying on a join that doesn't work
        staff: undefined
      }));

      // Type the ticket data properly
      const typedTicket: SupportTicket = {
        ...ticketData,
        clients: ticketData.clients ? {
          name: ticketData.clients.name,
          email: ticketData.clients.email
        } : undefined,
        staff: ticketData.barbers ? {
          name: ticketData.barbers.name
        } : undefined
      };

      setTicket(typedTicket);
      setResponses(typedResponses);
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

  const handleStatusChange = async (status: string) => {
    if (ticket) {
      await onStatusChange(ticket.id, status);
    }
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
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">Fechar</button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <TicketHeader ticket={ticket} formatDate={formatDate} />
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <TicketDescription ticket={ticket} />
              
              <div className="space-y-4 mt-6">
                <h3 className="font-medium">Histórico de Respostas</h3>
                <ResponseList 
                  responses={responses} 
                  formatDate={formatDate} 
                  getResponderName={getResponderName} 
                />
              </div>
              
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <ResponseForm 
                  newResponse={newResponse} 
                  setNewResponse={setNewResponse} 
                  handleSubmitResponse={handleSubmitResponse} 
                  isSubmitting={isSubmitting} 
                />
              )}
            </div>
            
            <DialogFooter>
              {ticket.status !== 'closed' && (
                <TicketActions 
                  ticketStatus={ticket.status} 
                  onClose={onClose}
                  onStatusChange={handleStatusChange}
                  ticketId={ticket.id}
                />
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetails;
