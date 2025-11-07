
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';

const AdminMarketing: React.FC = () => {
  return (
    <AdminLayout title="Marketing">
      <div className="w-full max-w-none h-full bg-gray-50 overflow-hidden">
        <MarketingManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
