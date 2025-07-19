import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout title="Agendamentos de Clientes">
      <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8 rounded-lg">
        <ClientAppointmentDashboard />
      </div>
    </AdminLayout>
  );
}
