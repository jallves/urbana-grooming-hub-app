
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';

const BarberCommissionsPage: React.FC = () => {
  return (
    <BarberLayout title="Minhas Comissões">
      <div className="panel-content-responsive">
        <BarberCommissionsComponent />
      </div>
    </BarberLayout>
  );
};

export default BarberCommissionsPage;
