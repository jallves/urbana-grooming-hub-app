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
    <div className="w-full space-y-3">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <StandardCard>
        <div className="mb-3">
          <h2 className="text-base md:text-lg font-bold text-urbana-light mb-1">Gerenciar Meus Horários</h2>
          <p className="text-[10px] md:text-xs text-urbana-light/70">
            Configure seus horários de trabalho e registre suas ausências
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-urbana-black/40 backdrop-blur-sm border border-urbana-gold/20 mb-3">
            <TabsTrigger 
              value="working-hours"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-xs py-1.5"
            >
              <Clock className="h-3 w-3 mr-1.5" />
              Horários Semanais
            </TabsTrigger>
            <TabsTrigger 
              value="time-off"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-xs py-1.5"
            >
              <Calendar className="h-3 w-3 mr-1.5" />
              Ausências/Folgas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-3">
            <Suspense fallback={<BarberScheduleSkeleton />}>
              <WorkingHoursManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-3">
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
