
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Horários dos Barbeiros</h1>
            <p className="text-muted-foreground">
              Configure os horários de trabalho de cada barbeiro
            </p>
          </header>

          <BarberScheduleManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
