import { useEffect, useState } from 'react';
import { Calendar, List, Download, Plus } from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
              table: 'appointments'
            },
            () => {
              toast.info('Appointment updated', {
                description: 'Data refreshed in real-time'
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        toast.error('Connection error', {
          description: 'Failed to establish real-time monitoring'
        });
      } finally {
        setIsLoading(false);
      }
    };

    const cleanup = setupRealtimeUpdates();

    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as AppointmentViewMode);
  };

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
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
              <p className="text-muted-foreground">
                Manage and view all scheduled appointments
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="size-4" />
                Export
              </Button>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                New Appointment
              </Button>
            </div>
          </header>

          <Tabs 
            value={viewMode} 
            onValueChange={handleViewModeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="size-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="size-4" />
                List
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