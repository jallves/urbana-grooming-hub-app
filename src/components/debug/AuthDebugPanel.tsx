import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const AuthDebugPanel: React.FC = () => {
  const auth = useAuth();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testDirectQuery = async () => {
    if (!auth.user?.id) return;
    
    setTestResult('testing');
    const start = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      
      const time = Date.now() - start;
      setQueryTime(time);
      
      if (error) {
        setTestResult('error');
        setDbRole(`Erro: ${error.message}`);
      } else {
        setTestResult('success');
        setDbRole(data?.role || 'Sem role');
      }
    } catch (err: any) {
      setTestResult('error');
      setDbRole(`Exceção: ${err.message}`);
    }
  };

  useEffect(() => {
    if (auth.user?.id) {
      testDirectQuery();
    }
  }, [auth.user?.id]);

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          🔍 Auth Debug Panel
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testDirectQuery}
            disabled={!auth.user}
          >
            Testar Query
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Estado do Auth Context */}
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Auth Context:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Loading: <Badge variant={auth.loading ? "destructive" : "default"}>{auth.loading ? "Sim" : "Não"}</Badge></div>
            <div>Roles Checked: <Badge variant={auth.rolesChecked ? "default" : "destructive"}>{auth.rolesChecked ? "Sim" : "Não"}</Badge></div>
            <div>User: <Badge variant={auth.user ? "default" : "secondary"}>{auth.user?.email || "Não logado"}</Badge></div>
            <div>Role: <Badge variant="outline">{auth.userRole || "Nenhuma"}</Badge></div>
          </div>
        </div>

        {/* Flags de Roles */}
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Flags de Role:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Master: <Badge variant={auth.isMaster ? "default" : "secondary"}>{auth.isMaster ? "✓" : "✗"}</Badge></div>
            <div>Admin: <Badge variant={auth.isAdmin ? "default" : "secondary"}>{auth.isAdmin ? "✓" : "✗"}</Badge></div>
            <div>Manager: <Badge variant={auth.isManager ? "default" : "secondary"}>{auth.isManager ? "✓" : "✗"}</Badge></div>
            <div>Barber: <Badge variant={auth.isBarber ? "default" : "secondary"}>{auth.isBarber ? "✓" : "✗"}</Badge></div>
          </div>
        </div>

        {/* Teste Direto */}
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Query Direta ao Banco:</div>
          <div className="space-y-1">
            <div>Status: <Badge 
              variant={
                testResult === 'success' ? 'default' : 
                testResult === 'error' ? 'destructive' : 
                testResult === 'testing' ? 'outline' : 'secondary'
              }
            >
              {testResult === 'testing' ? '⏳ Testando...' : 
               testResult === 'success' ? '✓ Sucesso' : 
               testResult === 'error' ? '✗ Erro' : 'Aguardando'}
            </Badge></div>
            {queryTime !== null && <div>Tempo: <Badge variant="outline">{queryTime}ms</Badge></div>}
            {dbRole && <div>Role DB: <Badge variant="outline">{dbRole}</Badge></div>}
          </div>
        </div>

        {/* Comparação */}
        {auth.userRole && dbRole && (
          <div className="space-y-1">
            <div className="font-semibold text-foreground">Comparação:</div>
            <div>
              {auth.userRole === dbRole ? (
                <Badge variant="default">✓ Context e DB estão sincronizados</Badge>
              ) : (
                <Badge variant="destructive">✗ Dessincronizados! Context: {auth.userRole} | DB: {dbRole}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
