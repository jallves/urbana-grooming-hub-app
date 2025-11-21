import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Trash2, Shield, Users, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  user_id: string | null;
  status: string;
}

const AdminManagerTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager'>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Buscar funcionários com cargo admin ou manager
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, role, user_id, status')
        .in('role', ['admin', 'manager'])
        .order('name');

      if (error) throw error;

      setEmployees(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar funcionários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os funcionários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiveAccess = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: 'Erro',
        description: 'Selecione um funcionário',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);

      // Buscar funcionário selecionado
      const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
      if (!selectedEmployee) {
        toast({
          title: 'Erro',
          description: 'Funcionário não encontrado',
          variant: 'destructive',
        });
        return;
      }

      // Se já tem user_id, apenas adicionar role
      if (selectedEmployee.user_id) {
        // Verificar se já tem role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', selectedEmployee.user_id)
          .in('role', ['master', 'admin', 'manager'])
          .maybeSingle();

        if (existingRole) {
          toast({
            title: 'Aviso',
            description: 'Este funcionário já possui acesso ao sistema',
            variant: 'destructive',
          });
          return;
        }

        // Adicionar role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedEmployee.user_id,
            role: selectedEmployee.role as 'admin' | 'manager',
          });

        if (roleError) throw roleError;
      } else {
        // Criar usuário no auth e vincular
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: selectedEmployee.email,
          password: tempPassword,
          email_confirm: true,
        });

        if (authError) throw authError;

        // Atualizar employee com user_id
        const { error: updateError } = await supabase
          .from('employees')
          .update({ user_id: authData.user.id })
          .eq('id', selectedEmployee.id);

        if (updateError) throw updateError;

        // Adicionar role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: selectedEmployee.role as 'admin' | 'manager',
          });

        if (roleError) throw roleError;
      }

      toast({
        title: 'Sucesso',
        description: `${selectedEmployee.name} agora tem acesso ao sistema como ${selectedEmployee.role === 'admin' ? 'Administrador' : 'Gerente'}`,
      });

      setSelectedEmployeeId('');
      fetchEmployees();
    } catch (error: any) {
      console.error('Erro ao dar acesso:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível dar acesso ao funcionário',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRevokeAccess = async (employeeId: string, employeeName: string, userEmail: string) => {
    if (userEmail === 'joao.colimoides@gmail.com') {
      toast({
        title: 'Ação não permitida',
        description: 'O acesso do usuário master não pode ser removido',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja revogar o acesso de ${employeeName}?`)) {
      return;
    }

    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee?.user_id) return;

      // Remover role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employee.user_id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Acesso revogado com sucesso',
      });

      fetchEmployees();
    } catch (error: any) {
      console.error('Erro ao revogar acesso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar o acesso',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master':
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">Master</Badge>;
      case 'admin':
        return <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">Gerente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'master':
        return 'Acesso total ao sistema';
      case 'admin':
        return 'Acesso a todos os módulos exceto Configurações';
      case 'manager':
        return 'Acesso limitado - sem ERP Financeiro e Configurações';
      default:
        return '';
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const availableEmployees = employees.filter(e => !e.user_id);
  const employeesWithAccess = employees.filter(e => e.user_id);

  return (
    <div className="space-y-6">
      {/* Card de Dar Acesso */}
      {availableEmployees.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-urbana-gold" />
            Dar Acesso ao Sistema
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role === 'admin' ? 'Administrador' : 'Gerente'} ({employee.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGiveAccess}
              disabled={adding || !selectedEmployeeId}
              className="bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold-dark hover:to-yellow-600"
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Dar Acesso'
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Selecione um funcionário com cargo de Administrador ou Gerente para dar acesso ao sistema
          </p>
        </Card>
      )}

      {/* Lista de Funcionários com Acesso */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-urbana-gold" />
            Administradores e Gerentes com Acesso
          </h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: 'all' | 'admin' | 'manager') => setRoleFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Todos
                  </div>
                </SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : employeesWithAccess.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum funcionário com acesso encontrado
          </div>
        ) : filteredEmployees.filter(e => e.user_id).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum resultado encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees
                  .filter(e => e.user_id)
                  .map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getRolePermissions(employee.role)}
                      </TableCell>
                      <TableCell className="text-right">
                        {employee.email !== 'joao.colimoides@gmail.com' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeAccess(employee.id, employee.name, employee.email)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Card Informativo */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Hierarquia de Permissões
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600">Master:</span>
            <span>Acesso completo a todos os módulos (joao.colimoides@gmail.com)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">Administrador:</span>
            <span>Acesso a todos os módulos exceto Configurações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-green-600">Gerente:</span>
            <span>Acesso limitado - não pode acessar ERP Financeiro e Configurações</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminManagerTab;
