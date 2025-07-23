
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
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
        <StandardBarberLayout>
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="text-red-400 text-lg font-semibold">Acesso negado</div>
            </div>
          </div>
        </StandardBarberLayout>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Meu Perfil">
      <StandardBarberLayout>
        <BarberProfileForm />
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberProfile;
