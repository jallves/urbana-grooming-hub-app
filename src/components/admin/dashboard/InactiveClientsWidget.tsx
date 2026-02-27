import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, MessageCircle, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InactiveClient {
  id: string;
  nome: string;
  whatsapp: string | null;
  ultimo_agendamento: string | null;
  dias_sem_agendar: number;
}

const InactiveClientsWidget: React.FC = () => {
  const { data: inactiveClients, isLoading } = useQuery({
    queryKey: ['inactive-clients-dashboard'],
    queryFn: async () => {
      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from('painel_clientes')
        .select('id, nome, whatsapp, telefone');

      if (clientsError) throw clientsError;
      if (!clients || clients.length === 0) return [];

      // Fetch all appointments ordered by date desc
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select('cliente_id, data')
        .in('cliente_id', clients.map(c => c.id))
        .order('data', { ascending: false });

      const today = new Date();

      // Map last appointment per client
      const lastAppointmentMap = new Map<string, string>();
      if (appointments) {
        for (const apt of appointments) {
          if (apt.cliente_id && !lastAppointmentMap.has(apt.cliente_id)) {
            lastAppointmentMap.set(apt.cliente_id, apt.data);
          }
        }
      }

      // Build inactive clients list
      const result: InactiveClient[] = clients.map(client => {
        const lastDate = lastAppointmentMap.get(client.id);
        const dias = lastDate
          ? differenceInDays(today, parseISO(lastDate))
          : differenceInDays(today, new Date(0)); // never booked = very high

        return {
          id: client.id,
          nome: client.nome,
          whatsapp: client.whatsapp || client.telefone,
          ultimo_agendamento: lastDate || null,
          dias_sem_agendar: dias,
        };
      });

      // Sort by most days without booking, take top 10
      return result
        .sort((a, b) => b.dias_sem_agendar - a.dias_sem_agendar)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatWhatsAppUrl = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    const message = encodeURIComponent('Olá! Sentimos sua falta na Costa Urbana Barbearia. Que tal agendar um horário? 💈');
    return `https://wa.me/${number}?text=${message}`;
  };

  return (
    <Card className="bg-white border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <UserX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              Clientes Inativos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Top 10 clientes que estão há mais tempo sem agendar
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !inactiveClients || inactiveClients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum cliente encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {inactiveClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-foreground">{client.nome}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {client.ultimo_agendamento ? (
                        <span>
                          Último: {format(parseISO(client.ultimo_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                          {' '}({client.dias_sem_agendar} dias)
                        </span>
                      ) : (
                        <span>Nunca agendou</span>
                      )}
                    </div>
                  </div>
                </div>
                {client.whatsapp && (
                  <a
                    href={formatWhatsAppUrl(client.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 flex-shrink-0"
                      title="Enviar mensagem no WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InactiveClientsWidget;
