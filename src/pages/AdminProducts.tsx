
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout title="Produtos e Serviços">
      <div className="w-full max-w-none h-full flex flex-col">
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-playfair">
            🧴 Gestão de Produtos e Serviços
          </h1>
          <p className="text-muted-foreground font-raleway mt-2 text-sm sm:text-base">
            Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle.
          </p>
        </div>
        <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-6">
          <ProductManagement />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
