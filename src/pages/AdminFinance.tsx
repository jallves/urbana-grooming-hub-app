
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout title="Financeiro">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Gestão Financeira"
            description="Gestão financeira e fluxo de caixa da barbearia"
            gradient="from-black-500/10 to-orange-600/10"
          >
            <FinanceManagement />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
