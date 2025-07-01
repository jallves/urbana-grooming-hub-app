
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Filter } from 'lucide-react';
import EmployeeList from './EmployeeList';
import EmployeeForm from './EmployeeForm';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { Employee } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EmployeeManagement: React.FC = () => {
  const {
    employees,
    loading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    fetchEmployees,
    handleDeleteEmployee,
  } = useEmployeeManagement();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Gerenciamento de Funcionários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8 bg-zinc-800 border-zinc-700 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="barber">Barbeiro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Funcionário
            </Button>
          </div>

          {/* Lista de Funcionários */}
          <EmployeeList
            employees={employees}
            loading={loading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        </CardContent>
      </Card>

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editar Funcionário' : 'Adicionar Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
