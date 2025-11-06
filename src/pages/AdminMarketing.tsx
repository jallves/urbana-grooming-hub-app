
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminMarketing: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Marketing">
        <div className="w-full h-full bg-gray-50 overflow-hidden">
          <MarketingManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminMarketing;
