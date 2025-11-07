
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';

const AdminMarketing: React.FC = () => {
  return (
    <AdminLayout title="Marketing">
      <MarketingManagement />
    </AdminLayout>
  );
};

export default AdminMarketing;
