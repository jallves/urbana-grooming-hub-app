import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  service: {
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    name: string;
  };
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          clients!inner(name, phone, email),
          services!inner(name, price, duration),
          staff!inner(name)
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map((appointment: any) => ({
        id: appointment.id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        client: appointment.clients,
        service: appointment.services,
        staff: appointment.staff,
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', variant: 'default' as const },
      confirmed: { label: 'Confirmado', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os agendamentos da barbearia
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Agendamentos ({appointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando agendamentos...</p>
            ) : appointments.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {appointment.client.name}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Serviço:</strong> {appointment.service.name}</p>
                            <p><strong>Barbeiro:</strong> {appointment.staff.name}</p>
                            <p><strong>Preço:</strong> R$ {appointment.service.price}</p>
                          </div>
                          <div>
                            <p><strong>Data:</strong> {format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}</p>
                            <p><strong>Horário:</strong> {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })} - {format(new Date(appointment.end_time), "HH:mm", { locale: ptBR })}</p>
                            <p><strong>Telefone:</strong> {appointment.client.phone}</p>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                            <strong>Observações:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
