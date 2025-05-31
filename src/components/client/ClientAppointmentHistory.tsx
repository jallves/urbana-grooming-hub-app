
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Calendar, Clock, User } from 'lucide-react';

interface AppointmentHistoryItem {
  id: string;
  action: string;
  created_at: string;
  old_values: any;
  new_values: any;
  appointment: {
    start_time: string;
    service: {
      name: string;
    };
    staff: {
      name: string;
    };
  };
}

export const ClientAppointmentHistory = () => {
  const { client } = useClientAuth();
  const [history, setHistory] = useState<AppointmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      fetchHistory();
    }
  }, [client]);

  const fetchHistory = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('appointment_history')
        .select(`
          id,
          action,
          created_at,
          old_values,
          new_values,
          appointment:appointments(
            start_time,
            service:services(name),
            staff:staff(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      created: { label: 'Criado', variant: 'default' as const },
      updated: { label: 'Atualizado', variant: 'secondary' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
    };

    const config = actionConfig[action as keyof typeof actionConfig] || actionConfig.created;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionDescription = (action: string, item: AppointmentHistoryItem) => {
    switch (action) {
      case 'created':
        return 'Agendamento criado';
      case 'updated':
        return 'Agendamento modificado';
      case 'cancelled':
        return 'Agendamento cancelado';
      case 'completed':
        return 'Agendamento concluído';
      default:
        return 'Ação realizada';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6">
          <p className="text-white text-center">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6 text-center">
          <History className="h-12 w-12 text-urbana-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum histórico encontrado</h3>
          <p className="text-gray-300">Ainda não há registros de atividades em seus agendamentos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Histórico de Agendamentos</h2>
      
      {history.map((item) => (
        <Card key={item.id} className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-urbana-gold" />
                  {getActionDescription(item.action, item)}
                </CardTitle>
                <p className="text-gray-300 text-sm mt-1">
                  {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {getActionBadge(item.action)}
            </div>
          </CardHeader>
          <CardContent>
            {item.appointment && (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(item.appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="h-4 w-4" />
                    {format(new Date(item.appointment.start_time), 'HH:mm')}
                  </div>
                </div>
                <div>
                  <span className="text-white font-semibold">{item.appointment.service?.name}</span>
                  <span className="text-gray-300"> com {item.appointment.staff?.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
