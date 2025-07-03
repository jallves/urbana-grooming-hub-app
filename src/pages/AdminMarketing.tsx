
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import MarketingManagement from '../components/admin/marketing/MarketingManagement';

const AdminMarketing: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-clash mb-2">
            Marketing
          </h1>
          <p className="text-gray-400 font-inter">
            Gerenciamento de campanhas, cupons e estratégias de marketing
          </p>
        </div>
        <MarketingManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
