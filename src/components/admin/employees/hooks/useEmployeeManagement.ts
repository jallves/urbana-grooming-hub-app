
import { useState, useCallback, useMemo, useEffect } from 'react';
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

  // Realtime: escuta INSERT, UPDATE e DELETE na tabela employees e staff
  useEffect(() => {
    const channel = supabase
      .channel('employees-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtro de busca no cliente (memoizado)
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // Mutation para desativar funcionário
  const deactivateMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'inactive', is_active: false, updated_at: new Date().toISOString() })
        .eq('id', employeeId);
      if (error) throw error;

      // Buscar email para propagar inativação
      const { data: employee } = await supabase
        .from('employees')
        .select('email, role')
        .eq('id', employeeId)
        .single();

      if (employee?.email) {
        // Propagar para staff
        await supabase
          .from('staff')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('email', employee.email);
        // Propagar para painel_barbeiros
        await supabase
          .from('painel_barbeiros')
          .update({ is_active: false, ativo: false, updated_at: new Date().toISOString() })
          .eq('email', employee.email);
      }
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Funcionário desativado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['team-staff'] });
    },
    onError: (error: any) => {
      console.error('Error deactivating employee:', error);
      toast({ title: 'Erro', description: 'Erro ao desativar funcionário', variant: 'destructive' });
    }
  });

  // Mutation para reativar funcionário
  const reactivateMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'active', is_active: true, updated_at: new Date().toISOString() })
        .eq('id', employeeId);
      if (error) throw error;

      const { data: employee } = await supabase
        .from('employees')
        .select('email')
        .eq('id', employeeId)
        .single();

      if (employee?.email) {
        await supabase
          .from('staff')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('email', employee.email);
        await supabase
          .from('painel_barbeiros')
          .update({ is_active: true, ativo: true, updated_at: new Date().toISOString() })
          .eq('email', employee.email);
      }
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Funcionário reativado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['team-staff'] });
    },
    onError: (error: any) => {
      console.error('Error reactivating employee:', error);
      toast({ title: 'Erro', description: 'Erro ao reativar funcionário', variant: 'destructive' });
    }
  });

  // Mutation para deletar funcionário (apenas sem agendamentos)
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('role, email')
        .eq('id', employeeId)
        .single();

      if (fetchError) throw fetchError;

      if (employee.role === 'barber') {
        const { error: staffError } = await supabase
          .from('staff')
          .delete()
          .eq('email', employee.email);
        if (staffError) throw staffError;
      } else {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Funcionário excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      console.error('Error deleting employee:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir funcionário', variant: 'destructive' });
    }
  });

  const handleDeactivateEmployee = useCallback(async (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (employee.status === 'inactive') {
      if (!window.confirm('Deseja reativar este funcionário?')) return;
      reactivateMutation.mutate(employeeId);
    } else {
      if (!window.confirm('Deseja desativar este funcionário? Ele ficará INATIVO e não aparecerá nos agendamentos.')) return;
      deactivateMutation.mutate(employeeId);
    }
  }, [employees, deactivateMutation, reactivateMutation]);

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    // Check for existing appointments before allowing delete
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    // Check painel_barbeiros for linked appointments
    const { data: barber } = await supabase
      .from('painel_barbeiros')
      .select('id')
      .eq('email', employee.email)
      .maybeSingle();

    if (barber) {
      const { count } = await supabase
        .from('painel_agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('barbeiro_id', barber.id);

      if (count && count > 0) {
        toast({
          title: 'Não é possível excluir',
          description: `Este funcionário possui ${count} agendamento(s). Use a opção "Inativar" ao invés de excluir.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!window.confirm('Tem certeza que deseja excluir este funcionário permanentemente?')) return;
    deleteMutation.mutate(employeeId);
  }, [employees, deleteMutation, toast]);

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
    handleDeactivateEmployee,
  };
};
