
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign } from 'lucide-react';
import BarberAppointmentsComponent from '@/components/barber/BarberAppointments';
import BarberCommissions from './BarberCommissions';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Agendamentos e Comissões">
      <Tabs defaultValue="appointments" className="space-y-6">
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
          <BarberCommissions />
        </TabsContent>
      </Tabs>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;
