
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarberAppointmentForm from '@/components/barber/appointments/BarberAppointmentForm';
import { AppointmentStats } from './appointments/AppointmentStats';
import { AppointmentList } from './appointments/AppointmentList';
import { useBarberAppointments } from './appointments/useBarberAppointments';

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Agendamentos</h2>
      
      {/* Stats Cards */}
      <AppointmentStats stats={stats} />
      
      <Tabs defaultValue="proximos" className="w-full">
        <TabsList>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proximos">
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
        
        <TabsContent value="concluidos">
          <AppointmentList
            appointments={appointments.filter(a => a.status === 'completed')}
            loading={loading}
            updatingId={updatingId}
            onComplete={handleCompleteAppointment}
            onEdit={(id, startTime) => handleEditAppointment(id, startTime)}
            onCancel={handleCancelAppointment}
          />
        </TabsContent>
        
        <TabsContent value="todos">
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
  );
};

export default BarberAppointmentsComponent;
