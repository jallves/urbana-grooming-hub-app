
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';
import SeedDataButton from '@/components/admin/employees/SeedDataButton';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout title="Funcionários">
      <div className="space-y-4">
        <div className="flex justify-end">
          <SeedDataButton />
        </div>
        <EmployeeManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmployees;
