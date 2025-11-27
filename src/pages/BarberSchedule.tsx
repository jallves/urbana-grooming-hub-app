import React from 'react';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import BarberScheduleView from '@/components/barber/schedule/BarberScheduleView';
import { LoaderPage } from '@/components/ui/loader-page';

const BarberSchedule: React.FC = () => {
  const { barber, loading } = useBarberAuth();

  if (loading) {
    return <LoaderPage />;
  }

  if (!barber) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center py-8">
          <div className="text-red-400 text-lg font-semibold">Acesso negado</div>
        </div>
      </div>
    );
  }

  // O BarberScheduleView já usa BarberPageContainer internamente
  return <BarberScheduleView />;
};

export default BarberSchedule;
