import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarClock, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientMetricsProps {
  clientId: string;
}

interface ClientMetricsData {
  totalAppointments: number;
  nextAppointment: {
    id: string;
    service: string;
    date: Date;
    time: string;
  } | null;
  totalSpent: number;
  favoriteService: string | null;
}

export const ClientMetrics: React.FC<ClientMetricsProps> = ({ clientId }) => {
  const [metrics, setMetrics] = useState<ClientMetricsData>({
    totalAppointments: 0,
    nextAppointment: null,
    totalSpent: 0,
    favoriteService: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        // Fetch appointments
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            services (name, price)
          `)
          .eq('client_id', clientId)
          .order('start_time', { ascending: true });

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          return;
        }

        const totalAppointments = appointments?.length || 0;
        
        // Find next appointment
        const now = new Date();
        const nextAppointment = appointments?.find(apt => 
          new Date(apt.start_time) > now && apt.status !== 'cancelled'
        ) || null;

        // Calculate total spent
        const totalSpent = appointments
          ?.filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + ((apt.services as any)?.price || 0), 0) || 0;

        // Find favorite service
        const serviceCounts: Record<string, { count: number; name: string }> = {};
        
        appointments?.forEach(apt => {
          if (apt.status === 'completed' && (apt.services as any)?.name) {
            const serviceName = (apt.services as any).name;
            if (!serviceCounts[serviceName]) {
              serviceCounts[serviceName] = { count: 0, name: serviceName };
            }
            serviceCounts[serviceName].count++;
          }
        });

        const favoriteService = Object.values(serviceCounts)
          .sort((a, b) => b.count - a.count)[0]?.name || null;

        setMetrics({
          totalAppointments,
          nextAppointment: nextAppointment ? {
            id: nextAppointment.id,
            service: (nextAppointment.services as any)?.name || 'Serviço não encontrado',
            date: new Date(nextAppointment.start_time),
            time: new Date(nextAppointment.start_time).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          } : null,
          totalSpent,
          favoriteService
        });

      } catch (error) {
        console.error('Error fetching client metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [clientId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
          <ClipboardList className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalAppointments}</div>
          <p className="text-xs text-gray-500">Total de agendamentos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximo Agendamento</CardTitle>
          <CalendarClock className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          {metrics.nextAppointment ? (
            <>
              <div className="text-xl font-bold">{metrics.nextAppointment.service}</div>
              <time className="text-sm text-gray-500">
                {format(metrics.nextAppointment.date, 'dd/MM/yyyy', { locale: ptBR })} às {metrics.nextAppointment.time}
              </time>
            </>
          ) : (
            <div className="text-xl font-bold">Nenhum</div>
          )}
          <p className="text-xs text-gray-500">Seu próximo serviço</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {metrics.totalSpent.toFixed(2)}</div>
          <p className="text-xs text-gray-500">Total gasto em serviços</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Serviço Favorito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.favoriteService || 'Nenhum'}</div>
          <p className="text-xs text-gray-500">Serviço mais agendado</p>
        </CardContent>
      </Card>
    </div>
  );
};
