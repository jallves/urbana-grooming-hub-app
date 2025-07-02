
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
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-raleway">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-raleway">Gerente</Badge>;
      case 'barber':
        return <Badge className="bg-urbana-gold/20 text-urbana-gold border-urbana-gold/30 font-raleway">Barbeiro</Badge>;
      default:
        return <Badge variant="outline" className="font-raleway">Desconhecido</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-raleway">Ativo</Badge>
    ) : (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 font-raleway">Inativo</Badge>
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
      <div className="flex justify-center items-center p-12 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          <p className="text-gray-300 font-raleway">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg border-gray-700 bg-gray-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700 bg-black">
            <TableHead className="text-urbana-gold font-playfair font-medium">Funcionário</TableHead>
            <TableHead className="text-urbana-gold font-playfair font-medium">Email</TableHead>
            <TableHead className="text-urbana-gold font-playfair font-medium">Telefone</TableHead>
            <TableHead className="text-urbana-gold font-playfair font-medium">Cargo</TableHead>
            <TableHead className="text-urbana-gold font-playfair font-medium">Status</TableHead>
            <TableHead className="text-urbana-gold font-playfair font-medium">Último Login</TableHead>
            <TableHead className="text-right text-urbana-gold font-playfair font-medium">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id} className="border-gray-700 hover:bg-gray-800/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-urbana-gold/30">
                      <AvatarImage src={employee.photo_url} />
                      <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold font-playfair">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white font-raleway font-medium">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300 font-raleway">{employee.email}</TableCell>
                <TableCell className="text-gray-300 font-raleway">{employee.phone}</TableCell>
                <TableCell>{getRoleBadge(employee.role)}</TableCell>
                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                <TableCell className="text-gray-300 font-raleway">
                  {formatDate(employee.last_login)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-urbana-gold hover:bg-urbana-gold/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={() => onEdit(employee)}
                        className="text-white hover:bg-gray-700 font-raleway"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(employee.id)}
                        className="text-red-400 hover:bg-gray-700 font-raleway"
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
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-urbana-gold" />
                  </div>
                  <p className="text-gray-400 font-raleway">Nenhum funcionário encontrado</p>
                  <p className="text-gray-500 text-sm font-raleway">Adicione funcionários para começar</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeList;
