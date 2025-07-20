
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Loader2, UserPlus } from 'lucide-react';
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
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-raleway text-xs">Admin</Badge>;
      case 'manager':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-raleway text-xs">Gerente</Badge>;
      case 'barber':
        return <Badge className="bg-urbana-gold/20 text-urbana-gold border-urbana-gold/30 font-raleway text-xs">Barbeiro</Badge>;
      default:
        return <Badge variant="outline" className="font-raleway text-xs">Desconhecido</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-raleway text-xs">Ativo</Badge>
    ) : (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 font-raleway text-xs">Inativo</Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          <p className="text-gray-300 font-raleway text-sm">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Desktop/Tablet */}
      <div className="hidden md:block border rounded-lg border-gray-700 bg-gray-900">
        <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-700 bg-black text-urbana-gold font-playfair font-medium text-sm">
          <div>Funcionário</div>
          <div>Email</div>
          <div>Telefone</div>
          <div>Cargo</div>
          <div>Status</div>
          <div>Último Login</div>
          <div className="text-right">Ações</div>
        </div>
        
        {employees.length > 0 ? (
          employees.map((employee) => (
            <div key={employee.id} className="grid grid-cols-7 gap-4 p-4 border-b border-gray-700 hover:bg-gray-800/50 transition-colors items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border-2 border-urbana-gold/30">
                  <AvatarImage src={employee.photo_url} />
                  <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold font-playfair text-xs">
                    {employee.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-raleway font-medium text-sm truncate">{employee.name}</span>
              </div>
              <div className="text-gray-300 font-raleway text-sm truncate">{employee.email}</div>
              <div className="text-gray-300 font-raleway text-sm">{employee.phone}</div>
              <div>{getRoleBadge(employee.role)}</div>
              <div>{getStatusBadge(employee.status)}</div>
              <div className="text-gray-300 font-raleway text-sm">
                {formatDate(employee.last_login)}
              </div>
              <div className="text-right">
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
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-urbana-gold" />
              </div>
              <p className="text-gray-400 font-raleway">Nenhum funcionário encontrado</p>
            </div>
          </div>
        )}
      </div>

      {/* View Mobile */}
      <div className="md:hidden space-y-3">
        {employees.length > 0 ? (
          employees.map((employee) => (
            <div key={employee.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 border-2 border-urbana-gold/30">
                    <AvatarImage src={employee.photo_url} />
                    <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold font-playfair">
                      {employee.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-raleway font-medium text-sm truncate">{employee.name}</h3>
                    <p className="text-gray-300 font-raleway text-xs truncate">{employee.email}</p>
                  </div>
                </div>
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
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 font-raleway">Telefone:</span>
                  <span className="text-white font-raleway ml-1">{employee.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-raleway">Cargo:</span>
                  <div className="mt-1">{getRoleBadge(employee.role)}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-raleway">Status:</span>
                  <div className="mt-1">{getStatusBadge(employee.status)}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-raleway">Último Login:</span>
                  <span className="text-white font-raleway ml-1 text-xs">
                    {formatDate(employee.last_login)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-urbana-gold" />
              </div>
              <p className="text-gray-400 font-raleway">Nenhum funcionário encontrado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
