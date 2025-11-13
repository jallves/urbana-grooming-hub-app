import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout 
      title="Agendamentos de Clientes" 
      description="Visualize e gerencie todos os agendamentos dos clientes"
      icon="📋"
    >
      <div className="w-full h-full">
        <ClientAppointmentDashboard />
      </div>
    </AdminLayout>
  );
}
