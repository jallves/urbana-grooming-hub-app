
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppointmentSection from './appointment/AppointmentSection';
import { supabase } from '@/integrations/supabase/client';

const Appointment: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If user is logged in and is admin, redirect to admin appointments
    if (user && isAdmin) {
      navigate('/admin/agendamentos');
    } 
    // If user is logged in but not admin, they might be a barber
    // Check if they exist in the staff table with role 'barber'
    else if (user && !isAdmin) {
      const checkIfBarber = async () => {
        try {
          const { data } = await supabase
            .from('staff')
            .select('role')
            .eq('email', user.email)
            .single();
            
          if (data && data.role === 'barber') {
            navigate('/barbeiro/agendamentos');
          }
        } catch (error) {
          console.error('Error checking barber status:', error);
        }
      };
      
      checkIfBarber();
    }
  }, [user, isAdmin, navigate]);

  return <AppointmentSection />;
};

export default Appointment;
