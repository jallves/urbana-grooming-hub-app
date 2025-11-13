import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

export default function AdminAppointments() {
  return (
    <AdminLayout 
      title="Gestão de Agendamentos" 
      description="Gerencie todos os agendamentos da barbearia em tempo real"
      icon="📅"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Lista de agendamentos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <AppointmentList />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
