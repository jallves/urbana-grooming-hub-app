

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '../types';

export const useEmployeeManagement = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching employees...');
      
      let query = supabase
        .from('employees')
        .select('*')
        .order('name');

      // Aplicar filtros
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', data);

      let filteredData = data || [];

      // Filtro de busca por nome ou email
      if (searchQuery) {
        filteredData = filteredData.filter(employee =>
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Type assertion para garantir que os dados estão no formato correto
      const typedEmployees = filteredData.map(employee => ({
        ...employee,
        role: employee.role as 'admin' | 'manager' | 'barber',
        status: employee.status as 'active' | 'inactive'
      })) as Employee[];

      setEmployees(typedEmployees);
      console.log('Employees set successfully');
    } catch (error: any) {
      console.error('Erro ao buscar funcionários:', error);
      // Use toast directly here instead of from dependency
      toast({
        title: 'Erro',
        description: 'Erro ao carregar funcionários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]); // Remove toast from dependencies

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }

    try {
      console.log('Deleting employee:', employeeId);
      
      // Buscar o funcionário para verificar se é barbeiro
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('role, email')
        .eq('id', employeeId)
        .single();

      if (fetchError) {
        console.error('Error fetching employee:', fetchError);
        throw fetchError;
      }

      // Se for barbeiro, deletar da tabela staff (o trigger vai cuidar da sincronização)
      if (employee.role === 'barber') {
        const { error: staffError } = await supabase
          .from('staff')
          .delete()
          .eq('email', employee.email);

        if (staffError) {
          console.error('Error deleting from staff:', staffError);
          throw staffError;
        }
      } else {
        // Para outros roles, deletar diretamente da tabela employees
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) {
          console.error('Error deleting employee:', error);
          throw error;
        }
      }

      // Use toast directly here instead of from dependency
      toast({
        title: 'Sucesso',
        description: 'Funcionário excluído com sucesso!',
      });

      fetchEmployees();
    } catch (error: any) {
      console.error('Error in handleDeleteEmployee:', error);
      // Use toast directly here instead of from dependency
      toast({
        title: 'Erro',
        description: 'Erro ao excluir funcionário',
        variant: 'destructive',
      });
    }
  }, [fetchEmployees]); // Remove toast from dependencies

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
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
  };
};

