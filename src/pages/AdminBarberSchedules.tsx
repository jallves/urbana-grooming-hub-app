
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Horários dos Barbeiros">
        <div className="w-full h-full min-h-0 flex flex-col">
          <BarberScheduleManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
