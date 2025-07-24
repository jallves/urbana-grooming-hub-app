
import React from 'react';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
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
        <StandardBarberLayout>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center py-8">
              <div className="text-red-400 text-lg font-semibold">Acesso negado</div>
            </div>
          </div>
        </StandardBarberLayout>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Minha Agenda">
      <StandardBarberLayout>
        <div className="w-full h-full">
          <BarberScheduleView />
        </div>
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberSchedule;
