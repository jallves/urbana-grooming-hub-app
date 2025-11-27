import React from 'react';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

const BarberScheduleManagement: React.FC = () => {
  return (
    <BarberPageContainer>
      <BarberScheduleManager />
    </BarberPageContainer>
  );
};

export default BarberScheduleManagement;
