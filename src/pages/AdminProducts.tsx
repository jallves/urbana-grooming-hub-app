
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout title="Produtos e Serviços">
      <div className="w-full max-w-none h-full bg-white flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-playfair text-gray-900">
            🧴 Gestão de Produtos e Serviços
          </h1>
          <p className="text-gray-700 font-raleway mt-2 text-sm sm:text-base">
            Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle.
          </p>
        </div>
        <div className="flex-1 min-h-0 p-4 sm:p-6 bg-gray-50">
          <ProductManagement />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
