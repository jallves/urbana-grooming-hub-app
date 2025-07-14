import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="w-full space-y-4 px-4 py-2 sm:px-6 sm:py-4">
          <ModernCard
            title="Gestão Financeira"
            description="Gestão financeira e fluxo de caixa da barbearia"
            gradient="from-primary/10 to-secondary/10"
            className="w-full"
            headerClassName="px-4 py-3 sm:px-6 sm:py-4"
            contentClassName="overflow-x-auto"
          >
            <div className="min-w-[600px] md:min-w-full">
              <FinanceManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;
