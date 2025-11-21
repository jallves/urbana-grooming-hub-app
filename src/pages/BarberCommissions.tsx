
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';

const BarberCommissionsPage: React.FC = () => {
  return (
    <BarberLayout title="Minhas Comissões">
      <StandardBarberLayout>
        <BarberCommissionsComponent />
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberCommissionsPage;
