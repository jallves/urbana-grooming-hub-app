
import React, { useState } from 'react';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmployeeList from './EmployeeList';
import EmployeeForm from './EmployeeForm';

const EmployeeManagement: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Mobile-First */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
            Gestão de Funcionários
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Administre sua equipe de trabalho
          </p>
        </div>
        
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold text-xs sm:text-sm w-full sm:w-auto"
        >
          <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Funcionário</span>
          <span className="hidden sm:inline">Novo Funcionário</span>
        </Button>
      </div>

      {/* Filtros Mobile-Optimized */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-white flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3 lg:gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                placeholder="Buscar funcionários..."
                className="pl-8 sm:pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-xs sm:text-sm h-8 sm:h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Todos os cargos</SelectItem>
                <SelectItem value="barber" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Barbeiro</SelectItem>
                <SelectItem value="receptionist" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Recepcionista</SelectItem>
                <SelectItem value="manager" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Gerente</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Todos</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Ativos</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-gray-700 text-xs sm:text-sm">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Funcionários */}
      <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-white flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Equipe de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <EmployeeList 
              searchQuery={searchQuery} 
              roleFilter={roleFilter}
              statusFilter={statusFilter}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      {isFormOpen && (
        <EmployeeForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            // Recarregar lista
          }}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;
