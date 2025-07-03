
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
    return <div>Acesso negado</div>;
  }

  return (
    <BarberLayout title="Meu Perfil">
      <BarberProfileForm />
    </BarberLayout>
  );
};

export default BarberProfile;
