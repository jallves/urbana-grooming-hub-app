import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';

const BarberScheduleManagement: React.FC = () => {
  return (
    <BarberLayout title="Meus Horários">
      <StandardBarberLayout>
        <BarberScheduleManager />
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberScheduleManagement;
