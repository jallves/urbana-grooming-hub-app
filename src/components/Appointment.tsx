
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppointmentSection from './appointment/AppointmentSection';
import { supabase } from '@/integrations/supabase/client';

const Appointment: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Removed automatic redirection logic to allow admins to access appointment booking
  // Admins can still access their admin panel through the navbar

  return <AppointmentSection />;
};

export default Appointment;
