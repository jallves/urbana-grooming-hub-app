
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="space-y-6 bg-black min-h-screen p-6">
          <div className="bg-gray-900 border-gray-700 shadow-lg rounded-lg">
            <div className="border-b border-gray-700 p-6">
              <h1 className="text-2xl font-playfair text-urbana-gold">
                Gestão Financeira
              </h1>
              <p className="text-gray-300 font-raleway mt-2">
                Gestão financeira e fluxo de caixa da barbearia
              </p>
            </div>
            <div className="p-6">
              <FinanceManagement />
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;
