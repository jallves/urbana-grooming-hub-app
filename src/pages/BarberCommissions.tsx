import React from 'react';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

const BarberCommissionsPage: React.FC = () => {
  return (
    <BarberPageContainer>
      <BarberCommissionsComponent />
    </BarberPageContainer>
  );
};

export default BarberCommissionsPage;
