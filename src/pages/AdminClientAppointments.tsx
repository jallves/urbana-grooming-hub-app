import React from 'react';
import { CalendarDays } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout title="Agendamentos de Clientes">
      <ClientAppointmentDashboard />
    </AdminLayout>
  );
}
