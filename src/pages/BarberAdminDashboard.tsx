
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import BarberRoute from '../components/auth/BarberRoute';

const BarberAdminDashboard: React.FC = () => {
  return (
    <BarberRoute>
      <BarberLayout title="Dashboard Administrativo">
        <AdminDashboard />
      </BarberLayout>
    </BarberRoute>
  );
};

export default BarberAdminDashboard;
