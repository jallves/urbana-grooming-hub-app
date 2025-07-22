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
        <div className="w-full h-full min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg font-semibold">Acesso negado</div>
          </div>
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Minha Agenda">
      <div className="w-full h-full min-h-screen bg-gray-900">
        <div className="w-full space-y-6 p-6">
          <div className="flex-1 flex flex-col h-full min-h-0 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm">
            <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
              <BarberScheduleView />
            </div>
          </div>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberSchedule;
