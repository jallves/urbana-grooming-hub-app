
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import GeneralSettings from '../components/admin/settings/GeneralSettings';

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout>
      <GeneralSettings />
    </AdminLayout>
  );
};

export default AdminSettings;
