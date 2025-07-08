
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarberAppointmentForm from '@/components/barber/appointments/BarberAppointmentForm';
import { AppointmentStats } from './appointments/AppointmentStats';
import { AppointmentList } from './appointments/AppointmentList';
import { useBarberAppointments } from './appointments/useBarberAppointments';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import BarberLayout from './BarberLayout';

const BarberAppointmentsComponent: React.FC = () => {
  const {
    appointments,
    loading,
    stats,
    updatingId,
    isEditModalOpen,
    selectedAppointmentId,
    selectedAppointmentDate,
    handleCompleteAppointment,
    handleEditAppointment,
    handleCancelAppointment,
    closeEditModal
  } = useBarberAppointments();

  return (
    <BarberLayout title="Meus Agendamentos">
      <div className="space-y-6">
        {/* Stats Cards */}
        <AppointmentStats stats={stats} />
        
        <Tabs defaultValue="proximos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger 
              value="proximos" 
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Próximos
            </TabsTrigger>
            <TabsTrigger 
              value="concluidos" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Concluídos
            </TabsTrigger>
            <TabsTrigger 
              value="todos" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Todos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="proximos" className="mt-6">
            <AppointmentList
              appointments={appointments.filter(a => 
                a.status !== 'completed' && 
                a.status !== 'cancelled' && 
                new Date(a.start_time) > new Date()
              )}
              loading={loading}
              updatingId={updatingId}
              onComplete={handleCompleteAppointment}
              onEdit={(id, startTime) => handleEditAppointment(id, startTime)}
              onCancel={handleCancelAppointment}
            />
          </TabsContent>
          
          <TabsContent value="concluidos" className="mt-6">
            <AppointmentList
              appointments={appointments.filter(a => a.status === 'completed')}
              loading={loading}
              updatingId={updatingId}
              onComplete={handleCompleteAppointment}
              onEdit={(id, startTime) => handleEditAppointment(id, startTime)}
              onCancel={handleCancelAppointment}
            />
          </TabsContent>
          
          <TabsContent value="todos" className="mt-6">
            <AppointmentList
              appointments={appointments}
              loading={loading}
              updatingId={updatingId}
              onComplete={handleCompleteAppointment}
              onEdit={(id, startTime) => handleEditAppointment(id, startTime)}
              onCancel={handleCancelAppointment}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Appointment Modal */}
        {isEditModalOpen && (
          <BarberAppointmentForm
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            appointmentId={selectedAppointmentId || undefined}
            defaultDate={selectedAppointmentDate || undefined}
            dateTimeOnly={true}
          />
        )}
      </div>
    </BarberLayout>
  );
};

export default BarberAppointmentsComponent;
