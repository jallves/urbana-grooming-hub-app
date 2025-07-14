
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="w-full space-y-6 bg-gray-900">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Gestão Financeira</h1>
              <p className="text-gray-400">Gestão financeira e fluxo de caixa da barbearia</p>
            </div>
            <FinanceManagement />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;
