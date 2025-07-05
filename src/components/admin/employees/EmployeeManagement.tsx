
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
    <div className="space-y-6 bg-black min-h-screen p-6">
      <Card className="bg-gray-900 border-gray-700 shadow-lg">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-2xl font-playfair text-urbana-gold">
            Gerenciamento de Funcionários
          </CardTitle>
          <p className="text-gray-300 font-raleway">
            Gerencie administradores, gerentes e barbeiros da Urbana Barbearia
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-urbana-gold" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10 bg-black border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold focus:ring-urbana-gold/20 font-raleway"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-800">Todos os cargos</SelectItem>
                <SelectItem value="admin" className="text-white hover:bg-gray-800">Administrador</SelectItem>
                <SelectItem value="manager" className="text-white hover:bg-gray-800">Gerente</SelectItem>
                <SelectItem value="barber" className="text-white hover:bg-gray-800">Barbeiro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-800">Todos</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-gray-800">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-gray-800">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAddEmployee} 
              className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium transition-all duration-300 hover:scale-105"
            >
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
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-urbana-gold">
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
