
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '../types';

export const useEmployeeManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Use React Query para buscar funcionários com cache
  const { data: employees = [], isLoading: loading } = useQuery({
    queryKey: ['employees', roleFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .neq('role', 'master')
        .order('name');

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch last login from active_sessions for each employee email
      const emails = (data || []).map(e => e.email).filter(Boolean) as string[];
      let lastLoginMap = new Map<string, string>();
      
      if (emails.length > 0) {
        const { data: sessions } = await supabase
          .from('active_sessions')
          .select('user_email, login_at')
          .in('user_email', emails)
          .order('login_at', { ascending: false });

        if (sessions) {
          for (const session of sessions) {
            if (session.user_email && !lastLoginMap.has(session.user_email)) {
              lastLoginMap.set(session.user_email, session.login_at);
            }
          }
        }
      }

      return (data || []).map(employee => ({
        ...employee,
        role: employee.role as 'admin' | 'manager' | 'barber',
        status: employee.status as 'active' | 'inactive',
        last_login: lastLoginMap.get(employee.email || '') || undefined,
      })) as Employee[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Filtro de busca no cliente (memoizado)
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // Mutation para deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      // Buscar o funcionário
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('role, email')
        .eq('id', employeeId)
        .single();

      if (fetchError) throw fetchError;

      // Se for barbeiro, deletar da tabela staff
      if (employee.role === 'barber') {
        const { error: staffError } = await supabase
          .from('staff')
          .delete()
          .eq('email', employee.email);

        if (staffError) throw staffError;
      } else {
        // Para outros roles, deletar diretamente
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Funcionário excluído com sucesso!',
      });
      // Invalidar cache para recarregar
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir funcionário',
        variant: 'destructive',
      });
    }
  });

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }
    deleteMutation.mutate(employeeId);
  }, [deleteMutation]);

  const fetchEmployees = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  }, [queryClient]);

  return {
    employees: filteredEmployees,
    loading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    fetchEmployees,
    handleDeleteEmployee,
  };
};
