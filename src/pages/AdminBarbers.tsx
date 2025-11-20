
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BarberManagement from '@/components/admin/barbers/BarberManagement';

const AdminBarbers: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Barbeiros" 
      description="Gerencie a equipe de barbeiros"
      icon="✂️"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6 bg-gray-50">
        <BarberManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminBarbers;
