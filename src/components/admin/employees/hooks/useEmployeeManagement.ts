
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
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

      if (error) throw error;

      let filteredData = data || [];

      // Filtro de busca por nome ou email
      if (searchQuery) {
        filteredData = filteredData.filter(employee =>
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setEmployees(filteredData);
    } catch (error: any) {
      console.error('Erro ao buscar funcionários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar funcionários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Funcionário excluído com sucesso!',
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir funcionário',
        variant: 'destructive',
      });
    }
  };

  // Recarregar quando filtros mudarem
  useEffect(() => {
    fetchEmployees();
  }, [roleFilter, statusFilter, searchQuery]);

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
