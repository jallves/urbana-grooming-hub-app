
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Funcionários" 
      description="Gerencie todos os funcionários da barbearia"
      icon="👔"
    >
      <EmployeeManagement />
    </AdminLayout>
  );
};

export default AdminEmployees;
