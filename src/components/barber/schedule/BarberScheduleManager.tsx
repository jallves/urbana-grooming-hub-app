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
    <div className="w-full space-y-1.5 max-w-[700px] mx-auto mt-4">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <StandardCard>
        <div className="mb-1.5">
          <h2 className="text-xs md:text-sm font-bold text-urbana-light mb-0.5 leading-tight">Gerenciar Horários</h2>
          <p className="text-[8px] md:text-[9px] text-urbana-light/70 leading-tight">
            Configure horários e ausências
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-urbana-black/40 backdrop-blur-sm border border-urbana-gold/20 mb-1.5 h-7">
            <TabsTrigger 
              value="working-hours"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-[9px] py-0.5 h-6"
            >
              <Clock className="h-2 w-2 mr-1" />
              Horários
            </TabsTrigger>
            <TabsTrigger 
              value="time-off"
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-urbana-light text-[9px] py-0.5 h-6"
            >
              <Calendar className="h-2 w-2 mr-1" />
              Folgas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-1.5 mt-1">
            <Suspense fallback={<BarberScheduleSkeleton />}>
              <WorkingHoursManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-1.5 mt-1">
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
