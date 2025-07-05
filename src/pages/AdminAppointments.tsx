
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';
import ModernCard from '@/components/ui/containers/ModernCard';

export default function AdminAppointments() {
  return (
    <AdminLayout title="Agendamentos">
      <div className="w-full space-y-3 sm:space-y-4 p-1 sm:p-2">
        <ModernCard
          title="Gestão de Agendamentos"
          description="Gerencie todos os agendamentos da barbearia em tempo real"
          gradient="from-green-500/10 to-emerald-600/10"
          className="w-full"
        >
          <AppointmentList />
        </ModernCard>
      </div>
    </AdminLayout>
  );
}
