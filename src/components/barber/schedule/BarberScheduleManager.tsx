import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StandardCard from '../layouts/StandardCard';
import BookingAvailabilityToggle from './BookingAvailabilityToggle';
import { Calendar, Clock } from 'lucide-react';
import BarberScheduleSkeleton from '@/components/ui/loading/BarberScheduleSkeleton';

// Lazy load dos componentes pesados
const WorkingHoursManager = React.lazy(() => import('./WorkingHoursManager'));
const TimeOffManager = React.lazy(() => import('./TimeOffManager'));

const BarberScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('working-hours');

  return (
    <div className="w-full space-y-4">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <StandardCard>
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-urbana-light mb-2">Gerenciar Meus Horários</h2>
          <p className="text-xs md:text-sm text-urbana-light/70">
            Configure seus horários de trabalho e registre suas ausências
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-urbana-black/40 backdrop-blur-sm border border-urbana-gold/20 mb-4">
            <TabsTrigger 
              value="working-hours"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              Horários Semanais
            </TabsTrigger>
            <TabsTrigger 
              value="time-off"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Ausências/Folgas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-4">
            <Suspense fallback={<BarberScheduleSkeleton />}>
              <WorkingHoursManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-4">
            <Suspense fallback={<BarberScheduleSkeleton />}>
              <TimeOffManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </StandardCard>
    </div>
  );
};

export default BarberScheduleManager;
