
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminLayout title="Fluxo de Caixa">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Controle de Fluxo de Caixa"
            description="Controle detalhado do fluxo de caixa e movimentações financeiras"
            gradient="from-cyan-500/10 to-blue-600/10"
          >
            <CashFlowManagement />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCashFlow;
