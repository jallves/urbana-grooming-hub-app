
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Pencil, Trash2, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      case 'master':
        return (
          <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-sm">
            Master
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm">
            Administrador
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">
            Gerente
          </Badge>
        );
      case 'barber':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-sm">
            Barbeiro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            Usuário
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getUserPhoto = (user: UserWithRole) => {
    return user.image_url || user.photo_url || null;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          <span className="text-sm text-muted-foreground">Carregando usuários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Usuário</TableHead>
              <TableHead className="font-semibold text-gray-700 hidden md:table-cell">E-mail</TableHead>
              <TableHead className="font-semibold text-gray-700">Cargo</TableHead>
              <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Criado em</TableHead>
              <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Último acesso</TableHead>
              <TableHead className="text-right w-[80px] font-semibold text-gray-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => {
                const photoUrl = getUserPhoto(user);
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-sm">
                          {photoUrl ? (
                            <AvatarImage 
                              src={photoUrl} 
                              alt={user.name}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-urbana-gold/20 to-yellow-100 text-urbana-gold font-medium">
                            {getUserInitials(user.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-gray-900">{user.name || 'Sem nome'}</span>
                          <span className="block md:hidden text-xs text-muted-foreground mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-gray-600">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(user.created_at)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(user.last_sign_in_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onUpdateRole(user)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Alterar cargo</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteUser(user.id)}
                            className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Remover usuário</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-10 w-10 text-gray-300" />
                    <span className="text-muted-foreground">Nenhum usuário encontrado</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserTable;
