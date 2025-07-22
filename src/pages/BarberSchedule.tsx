
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
    return (
      <BarberLayout title="Minha Agenda">
        <div className="text-center py-12">
          <div className="text-red-400">Acesso negado</div>
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Minha Agenda">
      <div className="w-full h-full bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm">
        <div className="p-4 sm:p-6 w-full h-full">
          <BarberScheduleView />
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberSchedule;
