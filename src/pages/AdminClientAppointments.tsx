import React from 'react';
import { CalendarDays } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout title="Agendamentos de Clientes">
      <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <CalendarDays className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold">Agendamentos de Clientes</h1>
        </div>
        <ClientAppointmentDashboard />
      </div>
    </AdminLayout>
  );
}
