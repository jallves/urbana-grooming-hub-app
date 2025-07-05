
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminEmployees: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Funcionários">
        <div className="space-y-8">
          <div className="grid gap-6">
            <ModernCard
              title="Gestão de Funcionários"
              description="Gerencie administradores, gerentes e barbeiros da Urbana Barbearia"
              gradient="from-black-500/10 to-rose-600/10"
            >
              <EmployeeManagement />
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminEmployees;
