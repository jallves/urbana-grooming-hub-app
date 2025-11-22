import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StandardCard from '../layouts/StandardCard';
import WorkingHoursManager from './WorkingHoursManager';
import TimeOffManager from './TimeOffManager';
import BookingAvailabilityToggle from './BookingAvailabilityToggle';
import { Calendar, Clock, UserCheck } from 'lucide-react';

const BarberScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('working-hours');

  return (
    <div className="w-full px-4 space-y-6">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <StandardCard>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Meus Horários</h2>
          <p className="text-gray-400">
            Configure seus horários de trabalho e registre suas ausências
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 mb-6">
            <TabsTrigger 
              value="working-hours"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black"
            >
              <Clock className="h-4 w-4 mr-2" />
              Horários Semanais
            </TabsTrigger>
            <TabsTrigger 
              value="time-off"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Ausências/Folgas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-4">
            <WorkingHoursManager />
          </TabsContent>

          <TabsContent value="time-off" className="space-y-4">
            <TimeOffManager />
          </TabsContent>
        </Tabs>
      </StandardCard>
    </div>
  );
};

export default BarberScheduleManager;
