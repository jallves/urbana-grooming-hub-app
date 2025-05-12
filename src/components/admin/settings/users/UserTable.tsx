
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { UserWithRole } from './types';

interface UserTableProps {
  users: UserWithRole[];
  onUpdateRole: (user: UserWithRole) => void;
  onDeleteUser: (userId: string) => void;
  loading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ users, onUpdateRole, onDeleteUser, loading }) => {
  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <Badge className="bg-red-500">Administrador</Badge>;
      case 'barber':
        return <Badge className="bg-blue-500">Barbeiro</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-mail</TableHead>
            <TableHead className="hidden md:table-cell">Cargo</TableHead>
            <TableHead className="hidden md:table-cell">Criado em</TableHead>
            <TableHead className="hidden md:table-cell">Último acesso</TableHead>
            <TableHead className="text-right w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {getRoleBadge(user.role)}
                  <span className="md:hidden block mt-1 text-xs text-muted-foreground">
                    Criado: {formatDate(user.created_at)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(user.last_sign_in_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUpdateRole(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Alterar cargo</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remover usuário</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                Nenhum usuário encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
