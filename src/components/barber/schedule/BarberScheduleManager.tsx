import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingAvailabilityToggle from './BookingAvailabilityToggle';
import { Calendar, Clock, Settings, Lock, Repeat } from 'lucide-react';
import BarberScheduleSkeleton from '@/components/ui/loading/BarberScheduleSkeleton';
import BarberFilter from '@/components/barber/BarberFilter';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
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
const SlotBlockManager = React.lazy(() => import('./SlotBlockManager'));
const RecurringBlockManager = React.lazy(() => import('./RecurringBlockManager'));

const BarberScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('slot-blocks');
  const { data: barberData } = useBarberDataQuery();
  const isBarberAdmin = barberData?.is_barber_admin || false;
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const isViewingOther = isBarberAdmin && selectedBarberId && selectedBarberId !== barberData?.id;

  return (
    <div className="w-full space-y-4 max-w-[800px] mx-auto">
      {/* Barber Admin Filter */}
      {isBarberAdmin && barberData && (
        <div className="flex items-center justify-end">
          <BarberFilter
            isBarberAdmin={isBarberAdmin}
            currentBarberId={barberData.id}
            selectedBarberId={selectedBarberId || barberData.id}
            onBarberChange={setSelectedBarberId}
          />
        </div>
      )}

      {/* Toggle de Disponibilidade para Agendamentos */}
      {!isViewingOther && <BookingAvailabilityToggle />}

      <PainelBarbeiroCard variant="default">
        <PainelBarbeiroCardHeader className="p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-urbana-gold/20 rounded-xl">
              <Settings className="h-5 w-5 text-urbana-gold" />
            </div>
            <div>
              <PainelBarbeiroCardTitle className="text-base sm:text-lg text-urbana-light">
                Gerenciar Horários {isViewingOther ? '(Outro Barbeiro)' : ''}
              </PainelBarbeiroCardTitle>
              <PainelBarbeiroCardDescription className="text-xs sm:text-sm text-urbana-light/60">
                Configure horários de trabalho, bloqueios e folgas
              </PainelBarbeiroCardDescription>
            </div>
          </div>
        </PainelBarbeiroCardHeader>

        <PainelBarbeiroCardContent className="p-4 sm:p-5 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-urbana-black/50 backdrop-blur-sm border border-urbana-gold/20 rounded-xl p-1 h-auto gap-1 mb-4">
              <TabsTrigger value="slot-blocks"
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black data-[state=active]:shadow-lg text-urbana-light/80 hover:text-urbana-light text-[11px] sm:text-sm py-2 sm:py-3 px-1.5 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2">
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-medium truncate">Bloqueios</span>
              </TabsTrigger>
              <TabsTrigger value="working-hours"
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black data-[state=active]:shadow-lg text-urbana-light/80 hover:text-urbana-light text-[11px] sm:text-sm py-2 sm:py-3 px-1.5 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-medium truncate">Horários</span>
              </TabsTrigger>
              <TabsTrigger value="time-off"
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black data-[state=active]:shadow-lg text-urbana-light/80 hover:text-urbana-light text-[11px] sm:text-sm py-2 sm:py-3 px-1.5 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-medium truncate">Folgas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slot-blocks" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Suspense fallback={<BarberScheduleSkeleton />}>
                <SlotBlockManager overrideBarberId={isViewingOther ? selectedBarberId! : undefined} />
              </Suspense>
            </TabsContent>

            <TabsContent value="working-hours" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Suspense fallback={<BarberScheduleSkeleton />}>
                <WorkingHoursManager overrideBarberId={isViewingOther ? selectedBarberId! : undefined} />
              </Suspense>
            </TabsContent>

            <TabsContent value="time-off" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Suspense fallback={<BarberScheduleSkeleton />}>
                <TimeOffManager overrideBarberId={isViewingOther ? selectedBarberId! : undefined} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </PainelBarbeiroCardContent>
      </PainelBarbeiroCard>
    </div>
  );
};

export default BarberScheduleManager;
