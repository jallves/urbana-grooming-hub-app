import { useQuery } from '@tanstack/react-query';
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

  const { data: employee, isLoading: loading } = useQuery({
    queryKey: ['employee-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('employees')
        .select('name, email, role, photo_url')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Error fetching employee profile:', error);
        return null;
      }

      return data as EmployeeProfile;
    },
    enabled: !!user?.email,
    staleTime: Infinity, // Dados nunca ficam "stale" - permanecem em cache
    gcTime: Infinity, // Dados nunca são removidos do cache
    refetchOnMount: false, // Não refetch ao montar o componente
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
    refetchOnReconnect: false, // Não refetch ao reconectar
  });

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
