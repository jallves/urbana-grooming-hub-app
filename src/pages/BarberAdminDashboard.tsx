
import React from 'react';
import AdminDashboard from '../components/admin/AdminDashboard';
import BarberRoute from '../components/auth/BarberRoute';

const BarberAdminDashboard: React.FC = () => {
  return (
    <BarberRoute>
      <AdminDashboard />
    </BarberRoute>
  );
};

export default BarberAdminDashboard;
