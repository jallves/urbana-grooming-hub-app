
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Fluxo de Caixa" 
      description="Controle todas as entradas e saídas financeiras"
      icon="💵"
    >
      <CashFlowManagement />
    </AdminLayout>
  );
};

export default AdminCashFlow;
