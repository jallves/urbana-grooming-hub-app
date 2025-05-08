
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AppointmentCalendar from '../components/admin/appointments/AppointmentCalendar';
import AppointmentList from '../components/admin/appointments/AppointmentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAppointments: React.FC = () => {
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
