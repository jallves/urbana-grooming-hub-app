
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminProducts: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Produtos e Serviços">
        <div className="h-full bg-gray-900 flex flex-col">
          <div className="p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-playfair text-urbana-gold">
              🧴 Gestão de Produtos e Serviços
            </h1>
            <p className="text-gray-300 font-raleway mt-2 text-sm sm:text-base">
              Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle.
            </p>
          </div>
          <div className="flex-1 min-h-0 p-4 sm:p-6">
            <ProductManagement />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminProducts;
