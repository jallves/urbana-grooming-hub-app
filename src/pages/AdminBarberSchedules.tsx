
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Horários dos Barbeiros
            </h1>
            <p className="text-gray-400 font-inter">
              Configure os horários de trabalho de cada barbeiro
            </p>
          </div>
          <BarberScheduleManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
