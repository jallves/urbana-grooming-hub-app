
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserWithRole, AppRole } from '../types';
import { sanitizeInput } from '@/lib/security';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users via RPC get_admin_manager_details...");
      const { data: employeeData, error: rpcError } = await supabase
        .rpc('get_admin_manager_details');

      if (rpcError) {
        console.error("Error fetching via RPC:", rpcError);
        setError(rpcError.message || 'Erro ao buscar usuários');
        throw rpcError;
      }
      
      console.log("Fetched employee data:", employeeData);
      
      // Mapear dados de employees para UserWithRole
      const usersWithRoles = (employeeData || []).map((emp: any) => ({
        id: emp.user_id || emp.employee_id,
        email: emp.email,
        created_at: emp.created_at,
        last_sign_in_at: emp.last_login,
        role: emp.role || 'user'
      }));

      console.log("Processed users with roles:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError((error as Error).message);
      toast.error('Erro ao carregar usuários', { 
        description: (error as Error).message 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        setError(null);
        
        // Buscar employee_id pelo user_id
        const { data: employeeData } = await supabase
          .rpc('get_admin_manager_details');
        
        const employee = (employeeData || []).find((emp: any) => emp.user_id === userId);
        
        if (!employee) {
          throw new Error('Usuário não encontrado');
        }
        
        // Usar RPC para revogar acesso
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('revoke_admin_manager_access', { p_employee_id: employee.employee_id });

        if (rpcError) {
          setError(rpcError.message || 'Erro ao remover usuário');
          throw rpcError;
        }

        const result = rpcData as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || 'Erro ao remover usuário');
        }

        toast.success('Usuário removido com sucesso');
        fetchUsers();
      } catch (error) {
        setError((error as Error).message);
        toast.error('Erro ao remover usuário', { 
          description: (error as Error).message 
        });
      }
    }
  }, [fetchUsers]);

  const handleSyncStaff = useCallback(async () => {
    try {
      setSyncLoading(true);
      setError(null);
      
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);
        
      if (staffError) {
        setError(staffError.message || 'Erro ao buscar profissionais');
        throw staffError;
      }
      
      if (!staffMembers || staffMembers.length === 0) {
        toast.info('Não há profissionais ativos para sincronizar');
        setSyncLoading(false);
        return;
      }
      
      console.log('Fetched active staff members:', staffMembers);

      const { data: existingUsers, error: usersError } = await supabase
        .rpc('get_admin_manager_details');
        
      if (usersError) {
        setError(usersError.message || 'Erro ao buscar usuários existentes');
        throw usersError;
      }
      
      const existingEmails = new Set((existingUsers || []).map((user: any) => 
        user.email?.toLowerCase()).filter(Boolean));
      
      console.log('Existing emails:', Array.from(existingEmails));
      
      const newStaff = staffMembers.filter(staff => 
        staff.email && !existingEmails.has(staff.email.toLowerCase())
      );
      
      console.log('New staff to add:', newStaff);
      
      if (newStaff.length === 0) {
        toast.info('Todos os profissionais já foram sincronizados como usuários');
        setSyncLoading(false);
        return;
      }

      let addedCount = 0;
      let errors = 0;
      
      for (const staff of newStaff) {
        const staffEmail = sanitizeInput(staff.email || `${staff.name.replace(/\s+/g, '').toLowerCase()}@exemplo.com`);
        const staffName = sanitizeInput(staff.name);
        console.log(`Adding staff: ${staffName} with email: ${staffEmail}`);
        
        try {
          const { data, error: rpcError } = await supabase.rpc(
            'add_barber_user' as any, 
            {
              p_email: staffEmail,
              p_name: staffName,
              p_role: 'barber'
            }
          );

          if (rpcError) {
            errors++;
            setError(rpcError.message || 'Erro ao adicionar barbeiro');
          } else {
            addedCount++;
          }
        } catch (e) {
          errors++;
          setError((e as Error).message);
        }
      }
      
      if (addedCount > 0) {
        toast.success(`${addedCount} profissionais foram adicionados como usuários`);
        fetchUsers();
        setError(null);
      } else if (errors > 0) {
        toast.error(`Não foi possível adicionar os profissionais. Verifique os logs para mais detalhes.`);
      }
    } catch (error) {
      setError((error as Error).message);
      toast.error('Erro ao sincronizar profissionais', { 
        description: (error as Error).message 
      });
    } finally {
      setSyncLoading(false);
    }
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) => user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    users: filteredUsers,
    loading,
    searchQuery,
    setSearchQuery,
    syncLoading,
    fetchUsers,
    handleDeleteUser,
    handleSyncStaff,
    error,
  };
};
