import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingAvailabilityToggle from './BookingAvailabilityToggle';
import { Calendar, Clock, Settings } from 'lucide-react';
import BarberScheduleSkeleton from '@/components/ui/loading/BarberScheduleSkeleton';
import { 
  PainelBarbeiroCard,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardDescription,
  PainelBarbeiroCardContent
} from '@/components/barber/PainelBarbeiroCard';

// Lazy load dos componentes pesados
const WorkingHoursManager = React.lazy(() => import('./WorkingHoursManager'));
const TimeOffManager = React.lazy(() => import('./TimeOffManager'));

const BarberScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('working-hours');

  return (
    <div className="w-full space-y-4 max-w-[800px] mx-auto">
      {/* Toggle de Disponibilidade para Agendamentos */}
      <BookingAvailabilityToggle />

      <PainelBarbeiroCard variant="default">
        {/* Header do card */}
        <PainelBarbeiroCardHeader className="p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-urbana-gold/20 rounded-xl">
              <Settings className="h-5 w-5 text-urbana-gold" />
            </div>
            <div>
              <PainelBarbeiroCardTitle className="text-base sm:text-lg text-urbana-light">
                Gerenciar Horários
              </PainelBarbeiroCardTitle>
              <PainelBarbeiroCardDescription className="text-xs sm:text-sm text-urbana-light/60">
                Configure seus horários de trabalho e folgas
              </PainelBarbeiroCardDescription>
            </div>
          </div>
        </PainelBarbeiroCardHeader>

        <PainelBarbeiroCardContent className="p-4 sm:p-5 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Abas melhoradas - Sem scroll */}
            <TabsList className="grid w-full grid-cols-2 bg-urbana-black/50 backdrop-blur-sm border border-urbana-gold/20 rounded-xl p-1 h-auto gap-1 mb-4">
              <TabsTrigger 
                value="working-hours"
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black data-[state=active]:shadow-lg text-urbana-light/80 hover:text-urbana-light text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Horários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="time-off"
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black data-[state=active]:shadow-lg text-urbana-light/80 hover:text-urbana-light text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Folgas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="working-hours" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Suspense fallback={<BarberScheduleSkeleton />}>
                <WorkingHoursManager />
              </Suspense>
            </TabsContent>

            <TabsContent value="time-off" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Suspense fallback={<BarberScheduleSkeleton />}>
                <TimeOffManager />
              </Suspense>
            </TabsContent>
          </Tabs>
        </PainelBarbeiroCardContent>
      </PainelBarbeiroCard>
    </div>
  );
};

export default BarberScheduleManager;
