
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Horários dos Barbeiros</h1>
            <p className="text-gray-500">Configure os horários de trabalho de todos os barbeiros</p>
          </div>
          
          <BarberScheduleManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
