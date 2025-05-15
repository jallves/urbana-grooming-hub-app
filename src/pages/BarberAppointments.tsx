
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign } from 'lucide-react';
import BarberAppointments from '@/components/barber/BarberAppointments';
import BarberCommissions from './BarberCommissions';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <ModuleAccessGuard moduleId="appointments">
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
          
          <TabsContent value="appointments">
            <BarberAppointments />
          </TabsContent>
          
          <TabsContent value="commissions">
            <BarberCommissions />
          </TabsContent>
        </Tabs>
      </BarberLayout>
    </ModuleAccessGuard>
  );
};

export default BarberAppointmentsPage;
