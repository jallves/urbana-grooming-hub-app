import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';
import ModernCard from '@/components/ui/containers/ModernCard';

export default function AdminAppointments() {
  return (
    <AdminLayout title="Agendamentos">
      <div className="w-full space-y-4 px-4 py-2 sm:px-6 sm:py-4">
        <ModernCard
          title="Gestão de Agendamentos"
          description="Gerencie todos os agendamentos da barbearia em tempo real"
          gradient="from-black/20 to-emerald-700/20"
          className="w-full"
          headerClassName="px-4 py-3 sm:px-6 sm:py-4"
          contentClassName="overflow-x-auto"
        >
          {/* Container fluido, sem min-width fixo, ocupa 100% e permite scroll se necessário */}
          <div className="w-full max-w-full">
            <AppointmentList />
          </div>
        </ModernCard>
      </div>
    </AdminLayout>
  );
}
