
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useBarberAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    revenue: 0,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching appointments for user:', user.email);
      
      // First try to find the staff record corresponding to the user's email
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
        
      if (staffError) {
        console.error('Erro ao buscar dados do profissional:', staffError);
        setLoading(false);
        return;
      }
      
      if (!staffData) {
        console.log('Nenhum registro de profissional encontrado para este usuário');
        setLoading(false);
        return;
      }
      
      // Fetch appointments for this barber
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (*),
          clients:client_id (*)
        `)
        .eq('staff_id', staffData.id)
        .order('start_time', { ascending: true });
        
      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
      } else {
        console.log('Agendamentos encontrados:', appointmentsData?.length || 0);
        
        // Calculate appointment stats
        const now = new Date();
        const completed = appointmentsData?.filter(a => a.status === 'completed') || [];
        const upcoming = appointmentsData?.filter(a => 
          a.status !== 'completed' && 
          a.status !== 'cancelled' && 
          new Date(a.start_time) > now
        ) || [];
        
        // Calculate revenue from completed appointments
        const revenue = completed.reduce((sum, app) => sum + Number(app.services?.price || 0), 0);
        
        setStats({
          total: appointmentsData?.length || 0,
          completed: completed.length,
          upcoming: upcoming.length,
          revenue: revenue
        });
        
        setAppointments(appointmentsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Set up a subscription for real-time updates
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Appointment data changed:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success('Agendamento finalizado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Não foi possível atualizar o agendamento');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditAppointment = (appointmentId: string, startTime: string) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedAppointmentDate(new Date(startTime));
    setIsEditModalOpen(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success('Agendamento cancelado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Não foi possível cancelar o agendamento');
    } finally {
      setUpdatingId(null);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedAppointmentDate(null);
  };

  return {
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
    closeEditModal,
    fetchAppointments
  };
};
