
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';

const BarberCommissionsPage: React.FC = () => {
  return (
    <BarberLayout title="Minhas Comissões">
      <div className="w-full h-full min-h-screen bg-gray-900">
        <div className="w-full space-y-6 p-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm p-6">
            <BarberCommissionsComponent />
          </div>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberCommissionsPage;
