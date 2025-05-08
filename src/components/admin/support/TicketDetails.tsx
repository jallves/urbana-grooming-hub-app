
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SupportTicket, TicketResponse } from '@/types/support';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TicketDetailsProps {
  ticket: SupportTicket;
  open: boolean;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, open, onClose, onStatusChange }) => {
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [responseText, setResponseText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    if (open && ticket) {
      loadResponses();
    }
  }, [ticket, open]);

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setResponses(data || []);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      toast.error('Não foi possível carregar as respostas do ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim()) {
      toast.error('Por favor, digite uma resposta');
      return;
    }

    setIsSending(true);
    try {
      const newResponse = {
        ticket_id: ticket.id,
        response_text: responseText,
        responder_type: 'staff',
        // Idealmente, substituir pelo ID do funcionário logado
        responder_id: null,
      };

      const { error } = await supabase
        .from('ticket_responses')
        .insert(newResponse);

      if (error) {
        throw error;
      }

      toast.success('Resposta enviada com sucesso');
      setResponseText('');
      loadResponses();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Não foi possível enviar a resposta');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(ticket.id, newStatus);
  };

  const getStatusTranslation = (status: string) => {
    const translations: Record<string, string> = {
      'open': 'Aberto',
      'in_progress': 'Em Progresso',
      'resolved': 'Resolvido',
      'closed': 'Fechado'
    };
    return translations[status] || status;
  };

  const getPriorityTranslation = (priority: string) => {
    const translations: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return translations[priority] || priority;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{ticket.subject}</DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={getStatusColor(ticket.status) as any}>
              {getStatusTranslation(ticket.status)}
            </Badge>
            <Badge variant={getPriorityColor(ticket.priority) as any}>
              Prioridade: {getPriorityTranslation(ticket.priority)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Criado em: {ticket.created_at && format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Descrição do problema</h3>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Histórico de respostas</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Ainda não há respostas para este ticket
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-3 rounded-md ${
                      response.responder_type === 'staff' ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {response.responder_type === 'staff' ? 'Atendente' : 'Cliente'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {response.created_at && format(new Date(response.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{response.response_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Adicionar resposta</h3>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleStatusChange('in_progress')}
              disabled={ticket.status === 'in_progress'}
            >
              Em Progresso
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange('resolved')}
              disabled={ticket.status === 'resolved'}
            >
              Resolvido
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange('closed')}
              disabled={ticket.status === 'closed'}
            >
              Fechar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={sendResponse} disabled={isSending || !responseText.trim()}>
              {isSending ? 'Enviando...' : 'Responder'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetails;
