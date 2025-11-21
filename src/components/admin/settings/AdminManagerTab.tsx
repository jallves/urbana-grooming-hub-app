import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Trash2, Shield, Users, Loader2, Filter, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeDetail {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  user_id: string | null;
  has_access: boolean;
  created_at: string;
  last_login: string | null;
}

const AdminManagerTab: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager'>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Usar função RPC segura
      const { data, error } = await supabase
        .rpc('get_admin_manager_details');

      if (error) throw error;

      setEmployees(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar funcionários:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os funcionários',
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

    if (!password || password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);

      const selectedEmployee = employees.find(e => e.employee_id === selectedEmployeeId);
      if (!selectedEmployee) {
        throw new Error('Funcionário não encontrado');
      }

      // Usar edge function para criar o usuário de forma segura
      const { data, error } = await supabase.functions.invoke('manage-admin-user', {
        body: {
          action: 'create',
          email: selectedEmployee.email,
          password: password,
          employeeId: selectedEmployeeId
        }
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; error?: string; user_id?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      toast({
        title: '✅ Acesso concedido com sucesso!',
        description: (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="font-semibold">{selectedEmployee.name}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Cargo:</span> {selectedEmployee.role === 'admin' ? 'Administrador' : 'Gerente'}</p>
              <p><span className="font-medium">E-mail:</span> {selectedEmployee.email}</p>
              <p className="text-green-600 font-medium flex items-center gap-1 mt-2">
                <CheckCircle2 className="h-3 w-3" />
                Senha cadastrada e acesso liberado
              </p>
            </div>
          </div>
        ),
        duration: 6000,
      });

      setSelectedEmployeeId('');
      setPassword('');
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
      // Buscar o user_id do employee
      const employee = employees.find(e => e.employee_id === employeeId);
      if (!employee || !employee.user_id) {
        throw new Error('Usuário não encontrado');
      }

      // Usar edge function para revogar acesso de forma segura
      const { data, error } = await supabase.functions.invoke('manage-admin-user', {
        body: {
          action: 'revoke',
          employeeId: employeeId
        }
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao revogar acesso');
      }

      toast({
        title: 'Sucesso',
        description: 'Acesso revogado com sucesso',
      });

      fetchEmployees();
    } catch (error: any) {
      console.error('Erro ao revogar acesso:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível revogar o acesso',
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const availableEmployees = employees.filter(e => !e.has_access && e.status === 'active');
  const employeesWithAccess = filteredEmployees.filter(e => e.has_access);

  return (
    <div className="space-y-6">
      {/* Card de Dar Acesso */}
      {availableEmployees.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-urbana-gold" />
            Dar Acesso ao Sistema
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select 
                value={selectedEmployeeId} 
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                      {employee.name} - {employee.role === 'admin' ? 'Administrador' : 'Gerente'} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha de Acesso
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={adding}
              />
              <p className="text-xs text-muted-foreground">
                A senha será usada pelo funcionário para acessar o sistema
              </p>
            </div>

            <Button
              onClick={handleGiveAccess}
              disabled={adding || !selectedEmployeeId || !password}
              className="w-full bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold-dark hover:to-yellow-600"
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Dar Acesso
                </>
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
          <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : employeesWithAccess.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum funcionário com acesso encontrado
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
                  <TableHead>Acesso Criado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesWithAccess.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(employee.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(employee.last_login)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {getRolePermissions(employee.role)}
                    </TableCell>
                    <TableCell className="text-right">
                      {employee.email !== 'joao.colimoides@gmail.com' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeAccess(employee.employee_id, employee.name, employee.email)}
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
