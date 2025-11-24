import React from 'react';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';

const BarberScheduleManagement: React.FC = () => {
  return (
    <StandardBarberLayout>
      <BarberScheduleManager />
    </StandardBarberLayout>
  );
};

export default BarberScheduleManagement;
