import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeProfile {
  name: string;
  email: string;
  role: string;
  photo_url?: string;
}

export const useEmployeeProfile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('name, email, role, photo_url')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error fetching employee profile:', error);
          setEmployee(null);
        } else {
          setEmployee(data);
        }
      } catch (error) {
        console.error('Error fetching employee profile:', error);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeProfile();
  }, [user?.email]);

  // Pega os dois primeiros nomes
  const getFirstTwoNames = () => {
    if (!employee?.name) return user?.email || 'Usuário';
    
    const nameParts = employee.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1]}`;
    }
    return nameParts[0] || user?.email || 'Usuário';
  };

  return {
    employee,
    loading,
    displayName: getFirstTwoNames(),
  };
};
