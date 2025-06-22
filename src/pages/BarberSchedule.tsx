
import React from 'react';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import BarberLayout from '@/components/barber/BarberLayout';
import BarberScheduleView from '@/components/barber/schedule/BarberScheduleView';
import { LoaderPage } from '@/components/ui/loader-page';

const BarberSchedule: React.FC = () => {
  const { barber, loading } = useBarberAuth();

  if (loading) {
    return <LoaderPage />;
  }

  if (!barber) {
    return <div>Acesso negado</div>;
  }

  return (
    <BarberLayout>
      <BarberScheduleView />
    </BarberLayout>
  );
};

export default BarberSchedule;
