
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

export default function AdminAppointments() {
  return (
    <AdminLayout title="Agendamentos">
      <div className="w-full h-full bg-white">
        <div className="w-full max-w-full mx-auto p-4 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-black">Gestão de Agendamentos</h1>
              <p className="text-sm text-gray-600 mt-1">Gerencie todos os agendamentos da barbearia em tempo real</p>
            </div>
            <div className="p-0">
              <AppointmentList />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
