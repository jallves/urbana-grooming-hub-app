
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentList from '@/components/admin/client-appointments/ClientAppointmentList';

export default function AdminClientAppointments() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos criados pelos clientes através do painel do cliente
          </p>
        </div>

        <ClientAppointmentList />
      </div>
    </AdminLayout>
  );
}
