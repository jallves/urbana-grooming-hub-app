
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BarberScheduleManagement from '@/components/admin/barbers/BarberScheduleManagement';

const AdminBarberSchedules: React.FC = () => {
  return (
    <AdminLayout 
      title="Horários dos Barbeiros" 
      description="Configure os horários de trabalho da equipe"
      icon="📅"
    >
      <BarberScheduleManagement />
    </AdminLayout>
  );
};

export default AdminBarberSchedules;
