
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';
import SeedDataButton from '@/components/admin/employees/SeedDataButton';
import CreateTestAppointmentButton from '@/components/admin/employees/CreateTestAppointmentButton';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout title="Funcionários">
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <SeedDataButton />
          <CreateTestAppointmentButton />
        </div>
        <EmployeeManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmployees;
