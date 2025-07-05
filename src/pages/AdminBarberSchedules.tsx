
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Horários dos Barbeiros">
        <div className="space-y-8">
          <div className="grid gap-6">
            <ModernCard
              title="Gestão de Escalas"
              description="Configure os horários de trabalho de cada barbeiro"
              gradient="from-black-500/10 to-blue-600/10"
            >
              <BarberScheduleManagement />
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;
