
import React, { useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AppointmentCalendar from '../components/admin/appointments/AppointmentCalendar';
import AppointmentList from '../components/admin/appointments/AppointmentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const AdminAppointments: React.FC = () => {
  // Configurar monitoramento em tempo real para agendamentos
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
          console.log('Dados de agendamentos atualizados:', payload);
          toast.info('Dados de agendamentos atualizados');
        }
      )
      .subscribe();

    // Confirma que RLS foi desativado e mostra uma mensagem inicial
    toast.success('Sistema de agendamentos inicializado', {
      description: 'Você pode criar, editar e visualizar agendamentos livremente'
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-gray-500">Gerencie todos os agendamentos da barbearia</p>
        </div>

        <Tabs defaultValue="calendario" className="w-full">
          <TabsList>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario" className="mt-6">
            <AppointmentCalendar />
          </TabsContent>
          
          <TabsContent value="lista" className="mt-6">
            <AppointmentList />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAppointments;
