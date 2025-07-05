
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentList from '@/components/admin/client-appointments/ClientAppointmentList';
import ModernCard from '@/components/ui/containers/ModernCard';

export default function AdminClientAppointments() {
  return (
    <AdminLayout title="Agendamentos de Clientes">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Painel de Clientes"
            description="Gerencie os agendamentos criados pelos clientes através do painel do cliente"
            gradient="from-purple-500/10 to-violet-600/10"
          >
            <ClientAppointmentList />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
}
