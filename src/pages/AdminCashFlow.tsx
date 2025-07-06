
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Fluxo de Caixa">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Controle de Fluxo de Caixa"
            description="Controle detalhado do fluxo de caixa e movimentações financeiras"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <CashFlowManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminCashFlow;
