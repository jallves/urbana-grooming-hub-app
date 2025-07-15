import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';
import ModernCard from '@/components/ui/containers/ModernCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminEmployees: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminRoute>
      <AdminLayout title="Funcionários">
        <div className="space-y-8">
          <div className="grid gap-6">
            <ModernCard
              title="Gestão de Funcionários"
              description="Gerencie administradores, gerentes e barbeiros da Urbana Barbearia"
              gradient={false}
              headerActions={
                <Button
                  onClick={() => navigate('/admin/employees/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Funcionário
                </Button>
              }
            >
              <div className="p-0">
                <EmployeeManagement />
              </div>
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminEmployees;