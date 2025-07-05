
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';
import ModernCard from '@/components/ui/containers/ModernCard';

export default function AdminAppointments() {
  return (
    <AdminLayout title="Agendamentos">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Gestão de Agendamentos"
            description="Gerencie todos os agendamentos da barbearia em tempo real"
            gradient="from-green-500/10 to-emerald-600/10"
          >
            <AppointmentList />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
}
