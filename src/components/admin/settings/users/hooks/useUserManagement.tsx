
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserWithRole, AppRole } from '../types';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from admin_users view
      const { data: authUsers, error: authError } = await supabase
        .from('admin_users')
        .select('*');

      if (authError) throw authError;
      
      // Map the data to include roles
      const usersWithRoles = authUsers.map(user => ({
        id: user.id || user.user_id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_login,
        role: user.role || 'user'
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários', { 
        description: (error as Error).message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        toast.success('Usuário removido com sucesso');
        fetchUsers();
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        toast.error('Erro ao remover usuário', { 
          description: (error as Error).message 
        });
      }
    }
  };

  const handleSyncStaff = async () => {
    try {
      setSyncLoading(true);
      
      // Fetch all active staff members
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);
        
      if (staffError) throw staffError;
      
      if (!staffMembers || staffMembers.length === 0) {
        toast.info('Não há profissionais ativos para sincronizar');
        setSyncLoading(false);
        return;
      }
      
      // Fetch existing users to avoid duplicates
      const { data: existingUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('email');
        
      if (usersError) throw usersError;
      
      const existingEmails = new Set((existingUsers || []).map(user => 
        user.email?.toLowerCase()).filter(Boolean));
      
      // Filter staff members who don't already exist as users
      const newStaff = staffMembers.filter(staff => 
        staff.email && !existingEmails.has(staff.email.toLowerCase())
      );
      
      if (newStaff.length === 0) {
        toast.info('Todos os profissionais já foram sincronizados como usuários');
        setSyncLoading(false);
        return;
      }

      // Use the RPC function to add barbers (more reliable than direct insert)
      for (const staff of newStaff) {
        const { error: rpcError } = await supabase.rpc('add_barber_user', {
          p_email: staff.email || `${staff.name.replace(/\s+/g, '').toLowerCase()}@exemplo.com`,
          p_name: staff.name,
          p_role: 'barber'
        });

        if (rpcError) {
          console.error('Erro ao adicionar barbeiro:', rpcError);
        }
      }
      
      toast.success(`${newStaff.length} profissionais foram adicionados como usuários`);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao sincronizar profissionais:', error);
      toast.error('Erro ao sincronizar profissionais', { 
        description: (error as Error).message 
      });
    } finally {
      setSyncLoading(false);
    }
  };

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
    handleSyncStaff
  };
};
