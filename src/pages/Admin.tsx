import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminRoute from '../components/auth/AdminRoute';

const AdminPage: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout>
        <div className="bg-amber-50 min-h-screen p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 border-b-2 border-amber-800 pb-4">
              <h1 className="text-3xl font-bold text-amber-900">Painel da Barbearia</h1>
              <p className="text-amber-700">Gerencie agendamentos, serviços e funcionários</p>
            </div>
            <AdminDashboard />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminPage;
