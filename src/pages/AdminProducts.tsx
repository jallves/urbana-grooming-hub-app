
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminProducts: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Produtos e Serviços">
        <div className="space-y-6 bg-black min-h-screen p-6">
          <div className="bg-gray-900 border-gray-700 shadow-lg rounded-lg">
            <div className="border-b border-gray-700 p-6">
              <h1 className="text-2xl font-playfair text-urbana-gold">
                🧴 Gestão de Produtos e Serviços
              </h1>
              <p className="text-gray-300 font-raleway mt-2">
                Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle.
              </p>
            </div>
            <div className="p-6">
              <ProductManagement />
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminProducts;
