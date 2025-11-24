
import React from 'react';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';

const BarberCommissionsPage: React.FC = () => {
  return (
    <StandardBarberLayout>
      <BarberCommissionsComponent />
    </StandardBarberLayout>
  );
};

export default BarberCommissionsPage;
