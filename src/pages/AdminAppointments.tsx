import { useEffect, useState } from 'react';
import { Calendar, List, Download, Plus } from 'lucide-react';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { AppointmentViewMode } from '@/types/admin';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import AppointmentCalendar from '@/components/admin/appointments/calendar/AppointmentCalendar';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

const AdminAppointments = () => {
  const [viewMode, setViewMode] = useState<AppointmentViewMode>('calendar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupRealtimeUpdates = async () => {
      try {
        const channel = supabase
          .channel('appointment-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'appointments',
            },
            () => {
              toast.info('Agendamento atualizado', {
                description: 'Os dados foram atualizados em tempo real.',
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        toast.error('Erro de conexão', {
          description: 'Falha ao monitorar atualizações em tempo real.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const cleanup = setupRealtimeUpdates();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as AppointmentViewMode);
  };

  const handleExport = () => {
    toast.info('Exportação em andamento...', {
      description: 'Funcionalidade de exportar ainda não implementada.',
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <LoadingSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminRoute allowedRoles={['admin', 'barber']}>
      <AdminLayout>
        <section className="space-y-6 p-4 sm:p-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                📅 Agendamentos
              </h1>
              <p className="text-muted-foreground">
                Visualize, gerencie e acompanhe todos os horários agendados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExport}
              >
                <Download className="size-4" />
                Exportar
              </Button>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Novo Agendamento
              </Button>
            </div>
          </header>

          <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="size-4" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="size-4" />
                Lista
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AppointmentCalendar />
              </motion.div>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AppointmentList />
              </motion.div>
            </TabsContent>
          </Tabs>
        </section>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAppointments;
