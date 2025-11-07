import React from 'react';
import { CalendarDays } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout title="Agendamentos de Clientes">
      <div className="h-full px-4 sm:px-6 lg:px-8 py-6">
        <ClientAppointmentDashboard />
      </div>
    </AdminLayout>
  );
}
