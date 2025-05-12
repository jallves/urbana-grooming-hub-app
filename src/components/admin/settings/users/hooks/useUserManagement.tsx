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
      
      // Fetch users from auth.users
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
  
  // Type AppRole to match the database enum
  type AppRole = 'admin' | 'barber' | 'user';

  const handleSyncStaff = async () => {
    try {
      setSyncLoading(true);
      
      // Buscar todos os profissionais ativos
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);
        
      if (staffError) throw staffError;
      
      if (!staffMembers || staffMembers.length === 0) {
        toast.info('Não há profissionais ativos para sincronizar');
        return;
      }
      
      // Buscar usuários existentes para evitar duplicatas
      const { data: existingUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('email');
        
      if (usersError) throw usersError;
      
      const existingEmails = new Set(existingUsers?.map(user => user.email?.toLowerCase()) || []);
      
      // Filtrar para pegar apenas profissionais que não estão na lista de usuários
      const newStaff = staffMembers.filter(staff => 
        staff.email && !existingEmails.has(staff.email.toLowerCase())
      );
      
      if (newStaff.length === 0) {
        toast.info('Todos os profissionais já foram sincronizados como usuários');
        return;
      }
      
      // Preparar dados para inserção
      const usersToInsert = newStaff.map((staff: any) => ({
        email: staff.email || `${staff.name.replace(/\s+/g, '').toLowerCase()}@exemplo.com`,
        name: staff.name,
        role: 'barber' as AppRole,
        created_at: new Date().toISOString()
      }));
      
      // Inserir os novos usuários
      const { error: insertError, data: insertedUsers } = await supabase
        .from('admin_users')
        .insert(usersToInsert)
        .select();
      
      if (insertError) throw insertError;
      
      // Adicionar registros à tabela user_roles
      if (insertedUsers && insertedUsers.length > 0) {
        // Preparar dados para inserção na tabela user_roles
        const rolesToInsert = insertedUsers.map(user => ({
          user_id: user.id,
          role: 'barber' as AppRole
        }));
        
        // Inserir um por um para evitar erro de tipo
        for (const roleData of rolesToInsert) {
          const { error: roleInsertError } = await supabase
            .from('user_roles')
            .insert(roleData);
            
          if (roleInsertError && !roleInsertError.message.includes('duplicate')) {
            console.error('Erro ao inserir papel:', roleInsertError);
          }
        }
      }
      
      toast.success(`${usersToInsert.length} profissionais foram adicionados como usuários`);
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

export { UserWithRole };
