
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/contexts/AuthContext';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isBarber } = useAuth();
  
  // Use useCallback to memoize the fetchAppointments function to prevent infinite re-renders
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching appointments. isAdmin:', isAdmin, 'isBarber:', isBarber);
      
      // If the user is not an admin and is a barber, only load their own appointments
      if (!isAdmin && isBarber && user) {
        // First get the staff ID for the current barber user
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (staffError) {
          console.error('Error fetching staff data:', staffError);
          toast.error("Não foi possível carregar os dados do profissional.");
          setIsLoading(false);
          return;
        }
        
        if (!staffData) {
          console.log('No staff record found for this user');
          setAppointments([]);
          setIsLoading(false);
          return;
        }
        
        // Then get appointments for this barber
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            client:client_id(*),
            service:service_id(*),
            staff:staff_id(*)
          `)
          .eq('staff_id', staffData.id)
          .order('start_time', { ascending: true });
        
        if (error) {
          console.error('Error fetching barber appointments:', error);
          throw error;
        }
        
        console.log('Barber appointments found:', data?.length || 0);
        setAppointments(data || []);
      } else {
        // Admin user - load all appointments
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            client:client_id(*),
            service:service_id(*),
            staff:staff_id(*)
          `)
          .order('start_time', { ascending: true });
        
        if (error) {
          console.error('Error fetching all appointments:', error);
          throw error;
        }
        
        console.log('All appointments found:', data?.length || 0);
        console.log('Appointments with staff data:', data);
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error("Não foi possível carregar os agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isBarber, user]); // Include dependencies for useCallback

  useEffect(() => {
    if (user) {
      fetchAppointments();
      
      // Add real-time subscription for appointments
      const channel = supabase
        .channel('appointment-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'appointments'
          },
          (payload) => {
            console.log('Appointment data changed:', payload);
            toast.info('Dados de agendamentos atualizados');
            fetchAppointments(); // Refresh data when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchAppointments]); // Add fetchAppointments as a dependency

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
      ));
      
      toast.success("Status atualizado", {
        description: "O status do agendamento foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error("Erro", {
        description: "Não foi possível atualizar o status.",
      });
    }
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
      
      toast.success("Agendamento excluído", {
        description: "O agendamento foi excluído com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error("Erro", {
        description: "Não foi possível excluir o agendamento.",
      });
      return false;
    }
  };

  return {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment
  };
};
