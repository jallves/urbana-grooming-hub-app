
import React from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import StandardCard from './layouts/StandardCard';
import AppointmentCardOptimized from './appointments/AppointmentCardOptimized';
import EditAppointmentModal from './appointments/EditAppointmentModal';
import { useBarberAppointmentsOptimized } from '@/hooks/barber/useBarberAppointmentsOptimized';

const BarberAppointments: React.FC = () => {
  const {
    appointments,
    loading,
    stats,
    updatingId,
    fetchAppointments,
    handleCompleteAppointment,
    handleCancelAppointment,
    isEditModalOpen,
    selectedAppointmentId,
    selectedAppointmentDate,
    handleEditAppointment,
    closeEditModal
  } = useBarberAppointmentsOptimized();

  const statsCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Calendar,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-600/5'
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      icon: TrendingUp,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-green-600/5'
    },
    {
      title: 'Próximos',
      value: stats.upcoming,
      icon: Clock,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-red-600/5'
    },
    {
      title: 'Receita',
      value: `R$ ${stats.revenue.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-emerald-600/5'
    }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StandardCard key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </StandardCard>
        ))}
      </div>

      {/* Appointments List */}
      <StandardCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Meus Agendamentos</h2>
            <button
              onClick={fetchAppointments}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Atualizar
            </button>
          </div>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <AppointmentCardOptimized
                  key={appointment.id}
                  appointment={appointment}
                  updatingId={updatingId}
                  onComplete={handleCompleteAppointment}
                  onCancel={handleCancelAppointment}
                  onEdit={handleEditAppointment}
                />
              ))}
            </div>
          )}
        </div>
      </StandardCard>

      {/* Edit Modal */}
      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        appointmentId={selectedAppointmentId}
        currentDate={selectedAppointmentDate}
        onSuccess={fetchAppointments}
      />
    </div>
  );
};

export default BarberAppointments;
