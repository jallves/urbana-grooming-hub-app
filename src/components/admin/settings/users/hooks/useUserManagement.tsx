import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserWithRole, AppRole } from '../types';
import { sanitizeInput } from '@/lib/security';

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
      
      // Fetch users from admin_users view with more detailed logging
      console.log("Fetching users from admin_users table...");
      const { data: authUsers, error: authError } = await supabase
        .from('admin_users')
        .select('*');

      if (authError) {
        console.error("Error fetching from admin_users:", authError);
        throw authError;
      }
      
      console.log("Fetched users data:", authUsers);
      
      // Map the data to include roles
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
      
      // Log fetched staff
      console.log('Fetched active staff members:', staffMembers);

      // Fetch existing users to avoid duplicates
      const { data: existingUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('email');
        
      if (usersError) throw usersError;
      
      const existingEmails = new Set((existingUsers || []).map(user => 
        user.email?.toLowerCase()).filter(Boolean));
      
      console.log('Existing emails:', Array.from(existingEmails));
      
      // Filter staff members who don't already exist as users
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
      
      // Use the RPC function to add barbers - REMOVED AUTOMATIC ADMIN ROLE ASSIGNMENT
      for (const staff of newStaff) {
        // Sanitize inputs before sending to database
        const staffEmail = sanitizeInput(staff.email || `${staff.name.replace(/\s+/g, '').toLowerCase()}@exemplo.com`);
        const staffName = sanitizeInput(staff.name);
        console.log(`Adding barber: ${staffName} with email: ${staffEmail}`);
        
        try {
          const { data, error: rpcError } = await supabase.rpc(
            'add_barber_user' as any, 
            {
              p_email: staffEmail,
              p_name: staffName,
              p_role: 'barber' // Default to barber role, not admin
            }
          );

          if (rpcError) {
            console.error('Erro ao adicionar barbeiro:', rpcError);
            errors++;
          } else {
            console.log('Barbeiro adicionado com sucesso:', data);
            addedCount++;
          }
        } catch (e) {
          console.error('Exception ao adicionar barbeiro:', e);
          errors++;
        }
      }
      
      if (addedCount > 0) {
        toast.success(`${addedCount} profissionais foram adicionados como usuários`);
        fetchUsers(); // Refresh the list after adding new users
      } else if (errors > 0) {
        toast.error(`Não foi possível adicionar os profissionais. Verifique os logs para mais detalhes.`);
      }
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
