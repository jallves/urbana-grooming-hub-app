
import React, { useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BarberAppointmentsComponent from '@/components/barber/BarberAppointments';
import BarberCommissionsComponent from '@/components/barber/BarberCommissions';

const BarberAppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'commissions' ? 'commissions' : 'appointments';
  
  return (
    <BarberLayout title="Agendamentos e Comissões">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Meus Agendamentos
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Minhas Comissões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="mt-4">
          <BarberAppointmentsComponent />
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-4">
          <BarberCommissionsComponent />
        </TabsContent>
      </Tabs>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;
