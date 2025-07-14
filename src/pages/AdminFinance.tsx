import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão Financeira"
            description="Gestão financeira e fluxo de caixa da barbearia"
            className="w-full max-w-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm transition-none hover:bg-gray-800/50"
            contentClassName="overflow-hidden transition-none"
          >
            <div className="w-full overflow-hidden transition-none">
              <FinanceManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;
