
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
        <div className="text-center py-12">
          <div className="text-red-400">Acesso negado</div>
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Meu Perfil">
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm p-6">
        <BarberProfileForm />
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
