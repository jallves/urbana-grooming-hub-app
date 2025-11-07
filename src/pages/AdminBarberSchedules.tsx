
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminLayout title="Horários dos Barbeiros">
      <div className="w-full max-w-none h-full min-h-0 flex flex-col">
        <BarberScheduleManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminBarberSchedules;
