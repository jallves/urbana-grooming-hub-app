
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarberAppointmentForm from '@/components/barber/appointments/BarberAppointmentForm';
import { AppointmentStats } from './appointments/AppointmentStats';
import { AppointmentList } from './appointments/AppointmentList';
import { useBarberAppointments } from './appointments/useBarberAppointments';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent">
              Meus Agendamentos
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Gerencie seus agendamentos com facilidade e eficiência
          </p>
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AppointmentStats stats={stats} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="proximos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 p-1 rounded-xl">
              <TabsTrigger 
                value="proximos" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black text-gray-300 font-medium rounded-lg transition-all duration-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Próximos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="concluidos" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-300 font-medium rounded-lg transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Concluídos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="todos" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-300 font-medium rounded-lg transition-all duration-300"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Todos</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="proximos" className="mt-8">
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
            
            <TabsContent value="concluidos" className="mt-8">
              <AppointmentList
                appointments={appointments.filter(a => a.status === 'completed')}
                loading={loading}
                updatingId={updatingId}
                onComplete={handleCompleteAppointment}
                onEdit={(id, startTime) => handleEditAppointment(id, startTime)}
                onCancel={handleCancelAppointment}
              />
            </TabsContent>
            
            <TabsContent value="todos" className="mt-8">
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
        </motion.div>

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
    </div>
  );
};

export default BarberAppointmentsComponent;
