import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';

export default function AdminAppointments() {
  return (
    <AdminLayout title="Agendamentos">
      <div className="w-full h-[calc(100vh-64px)] bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-full space-y-6">
          
          {/* Cabeçalho */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-slate-800">Gestão de Agendamentos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie todos os agendamentos da barbearia em tempo real
            </p>
          </div>

          {/* Conteúdo rolável dentro da área visível */}
          <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            <AppointmentList />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
