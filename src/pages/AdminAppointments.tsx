
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

export default function AdminAppointments() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-clash mb-2">
            Agendamentos
          </h1>
          <p className="text-gray-400 font-inter">
            Gerencie todos os agendamentos da barbearia em tempo real
          </p>
        </div>
        <AppointmentList />
      </div>
    </AdminLayout>
  );
}
