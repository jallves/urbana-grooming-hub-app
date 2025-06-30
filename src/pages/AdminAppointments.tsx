import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Calendar, List, Download, Plus } from 'lucide-react';
import AdminRoute from '@/components/auth/AdminRoute';
import { AppointmentViewMode } from '@/types/admin';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import AppointmentCalendar from '@/components/admin/appointments/calendar/AppointmentCalendar';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

const AdminAppointments = () => {
  const [activeTab, setActiveTab] = useState<AppointmentViewMode>('calendar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const channel = supabase
      .channel('appointment-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments'
        },
        (payload) => {
          console.log('Change received:', payload);
          toast.info('Agendamento atualizado', {
            description: 'Os dados foram atualizados em tempo real'
          });
        }
      )
      .subscribe(
        (status) => {
          if (status === 'SUBSCRIBED') {
            toast.success('Conexão estabelecida', {
              description: 'Monitorando alterações em tempo real'
            });
          }
        },
        (error) => {
          toast.error('Erro na conexão', {
            description: error.message || 'Não foi possível estabelecer monitoramento'
          });
        }
      );

    setIsLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminRoute allowedRoles={['admin', 'barber']}>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Agendamentos</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os agendamentos
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Exportar
              </Button>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Novo Agendamento
              </Button>
            </div>
          </header>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar size={16} />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List size={16} />
                Lista
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-6">
              <AppointmentCalendar />
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <AppointmentList />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAppointments;