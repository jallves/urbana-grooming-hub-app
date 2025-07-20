
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="h-full bg-gray-900 flex flex-col">
          <div className="p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-playfair text-urbana-gold">
              💰 Gestão Financeira
            </h1>
            <p className="text-gray-300 font-raleway mt-2 text-sm sm:text-base">
              Gestão financeira e fluxo de caixa da barbearia
            </p>
          </div>
          <div className="flex-1 min-h-0 p-4 sm:p-6">
            <FinanceManagement />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;
