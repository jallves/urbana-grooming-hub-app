import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialDashboard from '@/components/erp/FinancialDashboard';

const AdminERPFinancial: React.FC = () => {
  return (
    <AdminLayout title="ERP Financeiro">
      <div className="w-full h-full">
        <div className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-foreground">
            💼 Sistema ERP Financeiro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão completa e integrada de todas as transações financeiras
          </p>
        </div>
        <FinancialDashboard />
      </div>
    </AdminLayout>
  );
};

export default AdminERPFinancial;
