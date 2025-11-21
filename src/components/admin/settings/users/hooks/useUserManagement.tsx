
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
      
      console.log("Fetching users from admin_users table...");
      const { data: authUsers, error: authError } = await supabase
        .from('admin_users')
        .select('*');

      if (authError) {
        console.error("Error fetching from admin_users:", authError);
        setError(authError.message || 'Erro ao buscar usuários');
        throw authError;
      }
      
      console.log("Fetched users data:", authUsers);
      
      const usersWithRoles = authUsers.map(user => ({
        id: user.id || user.user_id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_login,
        role: user.role || 'user'
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
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', userId);

        if (error) {
          setError(error.message || 'Erro ao remover usuário');
          throw error;
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
        .from('admin_users')
        .select('email');
        
      if (usersError) {
        setError(usersError.message || 'Erro ao buscar usuários existentes');
        throw usersError;
      }
      
      const existingEmails = new Set((existingUsers || []).map(user => 
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
