
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '../types';
import { ConfirmActionType } from '../../shared/ConfirmActionDialog';

interface ConfirmDialogState {
  open: boolean;
  type: ConfirmActionType;
  title: string;
  description: string;
  entityName: string;
  linkedDataMessage?: string;
  onConfirm: () => void;
}

const defaultDialogState: ConfirmDialogState = {
  open: false,
  type: 'delete',
  title: '',
  description: '',
  entityName: '',
  onConfirm: () => {},
};

export const useEmployeeManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(defaultDialogState);

  const closeDialog = useCallback(() => {
    setConfirmDialog(defaultDialogState);
  }, []);

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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('employees-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

      const { data: employee } = await supabase
        .from('employees')
        .select('email, role')
        .eq('id', employeeId)
        .single();

      if (employee?.email) {
        await supabase.from('staff').update({ is_active: false, updated_at: new Date().toISOString() }).eq('email', employee.email);
        await supabase.from('painel_barbeiros').update({ is_active: false, ativo: false, updated_at: new Date().toISOString() }).eq('email', employee.email);
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
        await supabase.from('staff').update({ is_active: true, updated_at: new Date().toISOString() }).eq('email', employee.email);
        await supabase.from('painel_barbeiros').update({ is_active: true, ativo: true, updated_at: new Date().toISOString() }).eq('email', employee.email);
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

  // Mutation para deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('role, email')
        .eq('id', employeeId)
        .single();

      if (fetchError) throw fetchError;

      if (employee.role === 'barber') {
        const { error: staffError } = await supabase.from('staff').delete().eq('email', employee.email);
        if (staffError) throw staffError;
      } else {
        const { error } = await supabase.from('employees').delete().eq('id', employeeId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Funcionário excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['team-staff'] });
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
      setConfirmDialog({
        open: true,
        type: 'reactivate',
        title: 'Reativar Funcionário',
        description: 'Este funcionário voltará a aparecer nos agendamentos e listagens ativas do sistema.',
        entityName: employee.name,
        onConfirm: () => {
          reactivateMutation.mutate(employeeId);
          closeDialog();
        },
      });
    } else {
      setConfirmDialog({
        open: true,
        type: 'deactivate',
        title: 'Inativar Funcionário',
        description: 'O funcionário ficará INATIVO e não aparecerá nos agendamentos nem nas listagens ativas.',
        entityName: employee.name,
        linkedDataMessage: 'Os dados históricos (agendamentos, comissões, relatórios) serão preservados para auditoria.',
        onConfirm: () => {
          deactivateMutation.mutate(employeeId);
          closeDialog();
        },
      });
    }
  }, [employees, deactivateMutation, reactivateMutation, closeDialog]);

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    // Check for linked data
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
        setConfirmDialog({
          open: true,
          type: 'blocked',
          title: 'Exclusão Bloqueada',
          description: `Este funcionário possui ${count} agendamento(s) vinculado(s) e não pode ser excluído permanentemente.`,
          entityName: employee.name,
          linkedDataMessage: 'Para remover este funcionário das listagens ativas, utilize a opção "Inativar" no menu de ações.',
          onConfirm: closeDialog,
        });
        return;
      }
    }

    // No linked data — allow delete
    setConfirmDialog({
      open: true,
      type: 'delete',
      title: 'Excluir Funcionário',
      description: 'Esta ação é irreversível. Todos os dados deste funcionário serão removidos permanentemente do sistema.',
      entityName: employee.name,
      onConfirm: () => {
        deleteMutation.mutate(employeeId);
        closeDialog();
      },
    });
  }, [employees, deleteMutation, closeDialog]);

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
    confirmDialog,
    closeDialog,
  };
};
