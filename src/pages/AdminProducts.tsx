
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout title="Produtos e Serviços">
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-playfair">
            🧴 Gestão de Produtos e Serviços
          </h1>
          <p className="text-muted-foreground font-raleway mt-2 text-sm sm:text-base">
            Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle.
          </p>
        </div>
        <ProductManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
