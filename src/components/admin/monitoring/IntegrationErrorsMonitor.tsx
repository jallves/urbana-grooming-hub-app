import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface IntegrationError {
  id: string;
  error_type: string;
  appointment_id: string | null;
  error_message: string;
  error_details: any;
  retry_count: number;
  max_retries: number;
  status: string;
  created_at: string;
  last_retry_at: string | null;
}

export default function IntegrationErrorsMonitor() {
  const [errors, setErrors] = useState<IntegrationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState<string | null>(null);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setErrors((data || []) as IntegrationError[]);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de integração');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (error: IntegrationError) => {
    if (!error.appointment_id) {
      toast.error('Agendamento não identificado');
      return;
    }

    setReprocessing(error.id);
    try {
      // Chamar função de reprocessamento
      const { data: reprocessData, error: reprocessError } = await supabase
        .rpc('reprocess_failed_appointment', {
          p_agendamento_id: error.appointment_id
        });

      if (reprocessError) throw reprocessError;

      const resultData = reprocessData as any;
      if (!resultData.success) {
        throw new Error(resultData.error || 'Erro ao reprocessar');
      }

      // Chamar edge function
      const { data: result, error: funcError } = await supabase.functions.invoke(
        'create-financial-transaction',
        { body: resultData.data }
      );

      if (funcError) throw funcError;

      const funcResult = result as any;
      if (funcResult?.success) {
        toast.success('Transação reprocessada com sucesso!');
        fetchErrors(); // Atualizar lista
      } else {
        throw new Error(funcResult?.error || 'Falha ao criar transação');
      }
    } catch (error: any) {
      console.error('Erro ao reprocessar:', error);
      toast.error(error.message || 'Erro ao reprocessar transação');
    } finally {
      setReprocessing(null);
    }
  };

  const runMonitoring = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-failed-transactions');

      if (error) throw error;

      const monitorResult = data as any;
      if (monitorResult?.success) {
        toast.success(`Monitoramento concluído: ${monitorResult.data.reprocessed} reprocessados, ${monitorResult.data.failed} falharam`);
        fetchErrors();
      }
    } catch (error: any) {
      console.error('Erro ao executar monitoramento:', error);
      toast.error('Erro ao executar monitoramento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();

    // Realtime subscription
    const channel = supabase
      .channel('integration_errors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_error_logs'
        },
        () => {
          fetchErrors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      retrying: { variant: 'default', icon: RefreshCw, label: 'Tentando' },
      resolved: { variant: 'default', icon: CheckCircle, label: 'Resolvido', className: 'bg-green-500' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Falhou' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const pendingCount = errors.filter(e => e.status === 'pending').length;
  const failedCount = errors.filter(e => e.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monitor de Integrações</CardTitle>
            <CardDescription>
              Acompanhe e reprocesse falhas de integração Totem → ERP
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchErrors}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={runMonitoring}
              disabled={loading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Executar Monitoramento
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{errors.length}</div>
                <div className="text-sm text-muted-foreground">Total de Erros</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-muted-foreground">Críticos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {failedCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {failedCount} erro(s) crítico(s) requerem atenção manual (máximo de tentativas atingido)
            </AlertDescription>
          </Alert>
        )}

        {/* Errors List */}
        <div className="space-y-2">
          {loading && errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              Nenhum erro registrado! Sistema funcionando perfeitamente.
            </div>
          ) : (
            errors.map((error) => (
              <Card key={error.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(error.status)}
                      <Badge variant="outline">{error.error_type}</Badge>
                      {error.appointment_id && (
                        <span className="text-xs text-muted-foreground">
                          Agendamento: {error.appointment_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{error.error_message}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        Tentativas: {error.retry_count}/{error.max_retries}
                      </span>
                      <span>
                        Criado: {format(new Date(error.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {error.last_retry_at && (
                        <span>
                          Última tentativa: {format(new Date(error.last_retry_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  {error.status !== 'resolved' && error.appointment_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReprocess(error)}
                      disabled={reprocessing === error.id}
                    >
                      {reprocessing === error.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reprocessar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
