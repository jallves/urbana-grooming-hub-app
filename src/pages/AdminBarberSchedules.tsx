import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Horários dos Barbeiros">
        <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 lg:px-8">
          <ModernCard
            title="Gestão de Escalas"
            description="Configure os horários de trabalho de cada barbeiro"
            gradient="from-green-500/10 to-blue-600/10"
            className="w-full"
            headerClassName="px-4 py-3 sm:px-6 sm:py-4"
            contentClassName="overflow-x-auto"
          >
            <div className="min-w-[600px] md:min-w-full">
              <BarberScheduleManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;

