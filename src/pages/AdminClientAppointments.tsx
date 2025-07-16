import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentList from '@/components/admin/client-appointments/ClientAppointmentList';
import ModernCard from '@/components/ui/containers/ModernCard';
import { useAdminRealtimeNotifications } from '@/hooks/useAdminRealtimeNotifications';

export default function AdminClientAppointments() {
  // Ativar notificações em tempo real
  useAdminRealtimeNotifications();

  return (
    <AdminLayout title="Agendamentos de Clientes">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Painel de Clientes"
            description="Gerencie os agendamentos criados pelos clientes através do painel do cliente"
            gradient={false}
            className="bg-black border border-gray-200"
          >
            <div className="p-0">
              <ClientAppointmentList />
            </div>
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
}