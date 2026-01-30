import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserWithRole } from '../types';

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
      
      // Fetch users from staff table with photo URLs
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, email, role, is_active, created_at, updated_at, image_url, photo_url')
        .eq('is_active', true)
        .order('name');

      if (staffError) {
        console.error("Error fetching staff:", staffError);
        setError(staffError.message || 'Erro ao buscar usuários');
        throw staffError;
      }
      
      // Map staff data to UserWithRole format with photos
      const usersWithRoles: UserWithRole[] = (staffData || []).map((staff) => ({
        id: staff.id,
        email: staff.email || '',
        name: staff.name || 'Sem nome',
        created_at: staff.created_at || '',
        last_sign_in_at: staff.updated_at || null,
        role: (staff.role as 'master' | 'admin' | 'manager' | 'barber' | 'user') || 'user',
        image_url: staff.image_url || null,
        photo_url: staff.photo_url || null,
      }));

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
    if (window.confirm('Tem certeza que deseja desativar este usuário?')) {
      try {
        setError(null);
        
        // Deactivate staff member instead of deleting
        const { error: updateError } = await supabase
          .from('staff')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) {
          setError(updateError.message || 'Erro ao desativar usuário');
          throw updateError;
        }

        toast.success('Usuário desativado com sucesso');
        fetchUsers();
      } catch (error) {
        setError((error as Error).message);
        toast.error('Erro ao desativar usuário', { 
          description: (error as Error).message 
        });
      }
    }
  }, [fetchUsers]);

  const handleSyncStaff = useCallback(async () => {
    try {
      setSyncLoading(true);
      setError(null);
      
      // Just refresh the list
      await fetchUsers();
      toast.success('Lista de usuários atualizada');
    } catch (error) {
      setError((error as Error).message);
      toast.error('Erro ao sincronizar', { 
        description: (error as Error).message 
      });
    } finally {
      setSyncLoading(false);
    }
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) => 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
