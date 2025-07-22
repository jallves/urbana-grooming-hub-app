import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import BarberProfileForm from '@/components/barber/BarberProfileForm';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { LoaderPage } from '@/components/ui/loader-page';

const BarberProfile: React.FC = () => {
  const { barber, loading } = useBarberAuth();

  if (loading) {
    return <LoaderPage />;
  }

  if (!barber) {
    return (
      <BarberLayout title="Meu Perfil">
        <div className="w-full h-full min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg font-semibold">Acesso negado</div>
          </div>
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Meu Perfil">
      <div className="w-full h-full min-h-screen bg-gray-900">
        <div className="w-full space-y-6 p-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm p-6">
            <BarberProfileForm />
          </div>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
