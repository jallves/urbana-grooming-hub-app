
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
import { AppointmentCalendar } from '@/components/admin/appointments/calendar/AppointmentCalendar';
import { AppointmentList } from '@/components/admin/appointments/list/AppointmentList';

const AdminAppointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppointmentViewMode>('calendar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupRealtime = async () => {
      try {
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
          .subscribe();

        toast.success('Conexão estabelecida', {
          description: 'Monitorando alterações em tempo real'
        });

        setIsLoading(false);
        
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        toast.error('Erro na conexão', {
          description: 'Não foi possível estabelecer monitoramento'
        });
        setIsLoading(false);
      }
    };

    setupRealtime();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Agendamentos</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os agendamentos
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </header>

          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as AppointmentViewMode)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
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
