
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Horários dos Barbeiros">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão de Escalas"
            description="Configure os horários de trabalho de cada barbeiro"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <BarberScheduleManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
