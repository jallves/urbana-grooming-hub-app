
import { TicketResponse } from '@/types/support';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getResponderName = (response: TicketResponse) => {
  return response.responder_type === 'staff' ? 'Atendente' : 'Cliente';
};
