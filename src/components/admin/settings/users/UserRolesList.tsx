import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Users, User } from 'lucide-react';
import { toast } from 'sonner';

// Define type for valid roles
type AppRole = 'admin' | 'barber' | 'user' | 'moderator';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  user_email?: string;
  user_name?: string;
}

const UserRolesList: React.FC = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch user roles along with user information
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role
        `);

      if (error) throw error;

      // Get user information for each role
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(role => role.user_id))];
        
        const { data: adminUsers, error: usersError } = await supabase
          .from('admin_users')
          .select('id, email, name')
          .in('id', userIds);
        
        if (usersError) throw usersError;

        // Map users to their roles
        const rolesWithUserInfo = data.map(role => {
          const user = adminUsers?.find(u => u.id === role.user_id);
          return {
            ...role,
            user_email: user?.email || 'Email desconhecido',
            user_name: user?.name || 'Usuário desconhecido'
          };
        });
        
        setRoles(rolesWithUserInfo);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Erro ao buscar cargos de usuários:', error);
      toast.error('Erro ao carregar cargos de usuários', { 
        description: (error as Error).message 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'moderator':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'barber':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case 'barber':
        return <Users className="h-3 w-3 mr-1" />;
      case 'moderator':
        return <User className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atribuição de cargo encontrada
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.user_name}</TableCell>
                <TableCell>{role.user_email}</TableCell>
                <TableCell>
                  <Badge 
                    className={getRoleBadgeColor(role.role)}
                  >
                    <span className="flex items-center">
                      {getRoleIcon(role.role)}
                      {role.role}
                    </span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserRolesList;
