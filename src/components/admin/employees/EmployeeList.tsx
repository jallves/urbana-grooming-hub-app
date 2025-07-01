
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Employee } from './types';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  onEdit,
  onDelete,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Gerente</Badge>;
      case 'barber':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Barbeiro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="outline">Inativo</Badge>
    );
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="border rounded-md border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-gray-300">Funcionário</TableHead>
            <TableHead className="text-gray-300">Email</TableHead>
            <TableHead className="text-gray-300">Telefone</TableHead>
            <TableHead className="text-gray-300">Cargo</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Último Login</TableHead>
            <TableHead className="text-right text-gray-300">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id} className="border-zinc-700">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.photo_url} />
                      <AvatarFallback className="bg-zinc-700 text-white">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{employee.email}</TableCell>
                <TableCell className="text-gray-300">{employee.phone}</TableCell>
                <TableCell>{getRoleBadge(employee.role)}</TableCell>
                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                <TableCell className="text-gray-300">
                  {formatDate(employee.last_login)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem 
                        onClick={() => onEdit(employee)}
                        className="text-white hover:bg-zinc-700"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(employee.id)}
                        className="text-red-400 hover:bg-zinc-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                Nenhum funcionário encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeList;
