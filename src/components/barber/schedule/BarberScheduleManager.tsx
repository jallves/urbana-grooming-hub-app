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
    <div className="w-full space-y-2 max-w-[800px] mx-auto">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <StandardCard>
        <div className="mb-2">
          <h2 className="text-sm md:text-base font-bold text-urbana-light mb-0.5">Gerenciar Meus Horários</h2>
          <p className="text-[9px] md:text-[10px] text-urbana-light/70">
            Configure seus horários de trabalho e registre suas ausências
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-urbana-black/40 backdrop-blur-sm border border-urbana-gold/20 mb-2 h-8">
            <TabsTrigger 
              value="working-hours"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-[10px] py-1 h-7"
            >
              <Clock className="h-2.5 w-2.5 mr-1" />
              Horários Semanais
            </TabsTrigger>
            <TabsTrigger 
              value="time-off"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-[10px] py-1 h-7"
            >
              <Calendar className="h-2.5 w-2.5 mr-1" />
              Ausências/Folgas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-2 mt-2">
            <Suspense fallback={<BarberScheduleSkeleton />}>
              <WorkingHoursManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-2 mt-2">
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
