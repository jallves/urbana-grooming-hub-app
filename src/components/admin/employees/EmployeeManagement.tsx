
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
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
    <div className="w-full max-w-full space-y-4 sm:space-y-6 p-2 sm:p-4 bg-gray-50 min-h-screen">
      <Card className="bg-white border-gray-200 shadow-sm w-full">
        <CardHeader className="border-b border-gray-200 p-3 sm:p-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-2xl font-playfair text-gray-900">
                Funcionários
              </CardTitle>
              <p className="text-gray-700 font-raleway text-sm">
                Gerencie administradores, gerentes e barbeiros
              </p>
            </div>
            <Button 
              onClick={handleAddEmployee} 
              className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 font-raleway font-medium w-full sm:w-auto touch-manipulation"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 p-3 sm:p-6">
          {/* Filtros responsivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-urbana-gold" />
              <Input
                placeholder="Buscar..."
                className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-urbana-gold focus:ring-urbana-gold/20 font-raleway"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">Todos</SelectItem>
                <SelectItem value="admin" className="text-gray-900 hover:bg-gray-100">Admin</SelectItem>
                <SelectItem value="manager" className="text-gray-900 hover:bg-gray-100">Gerente</SelectItem>
                <SelectItem value="barber" className="text-gray-900 hover:bg-gray-100">Barbeiro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">Todos</SelectItem>
                <SelectItem value="active" className="text-gray-900 hover:bg-gray-100">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-gray-900 hover:bg-gray-100">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista responsiva */}
          <div className="w-full">
            <EmployeeList
              employees={employees}
              loading={loading}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog responsivo */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair text-gray-900">
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
