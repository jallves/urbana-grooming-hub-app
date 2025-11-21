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
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const fetchErrors = async () => {
    try {
      console.log('🔄 Buscando erros de integração...');
      setLoading(true);

      const { data, error } = await supabase
        .from('integration_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar logs:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} erros carregados`);
      setErrors((data || []) as IntegrationError[]);
    } catch (error: any) {
      console.error('❌ Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de integração', {
        description: error.message || 'Erro desconhecido'
      });
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
      console.log('🔄 Iniciando reprocessamento:', {
        error_id: error.id,
        appointment_id: error.appointment_id,
        retry_count: error.retry_count
      });

      // Chamar função RPC para preparar dados
      console.log('📞 Chamando RPC reprocess_failed_appointment...');
      const { data: reprocessData, error: reprocessError } = await supabase
        .rpc('reprocess_failed_appointment', {
          p_agendamento_id: error.appointment_id
        });

      if (reprocessError) {
        console.error('❌ Erro na RPC:', reprocessError);
        throw reprocessError;
      }

      console.log('📦 Resposta da RPC:', reprocessData);

      const resultData = reprocessData as any;
      if (!resultData.success) {
        const errorMsg = resultData.error || 'Erro ao preparar dados';
        console.error('❌ RPC retornou erro:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Dados preparados:', {
        appointment_id: resultData.data.appointment_id,
        items: resultData.data.items?.length,
        payment_method: resultData.data.payment_method
      });

      // Chamar edge function create-financial-transaction
      console.log('🚀 Chamando edge function...');
      const { data: result, error: funcError } = await supabase.functions.invoke(
        'create-financial-transaction',
        { body: resultData.data }
      );

      if (funcError) {
        console.error('❌ Erro na edge function:', funcError);
        throw funcError;
      }

      console.log('📊 Resposta da edge function:', result);

      const funcResult = result as any;
      if (funcResult?.success) {
        console.log('✅ Transação criada:', {
          records: funcResult.data?.records?.length,
          revenue: funcResult.data?.summary?.total_revenue
        });

        toast.success('Transação reprocessada com sucesso!', {
          description: `${funcResult.data?.records?.length || 0} registros criados`
        });

        // Incrementar contador de retry
        await supabase.rpc('increment_retry_count', { p_error_log_id: error.id });

        fetchErrors();
      } else {
        throw new Error(funcResult?.error || 'Falha ao criar transação');
      }
    } catch (error: any) {
      console.error('❌ Erro ao reprocessar:', error);

      // Incrementar contador mesmo em caso de erro
      try {
        await supabase.rpc('increment_retry_count', { p_error_log_id: error.id });
      } catch (retryError) {
        console.error('❌ Erro ao incrementar retry:', retryError);
      }

      toast.error('Erro ao reprocessar transação', {
        description: error.message || 'Erro desconhecido'
      });

      fetchErrors();
    } finally {
      setReprocessing(null);
    }
  };

  const runMonitoring = async () => {
    setLoading(true);
    try {
      console.log('🔍 Executando monitoramento de transações...');
      
      toast.info('Iniciando monitoramento...', {
        description: 'Verificando transações falhadas'
      });

      const { data, error } = await supabase.functions.invoke('monitor-failed-transactions');

      if (error) {
        console.error('❌ Erro ao chamar edge function:', error);
        
        // Se for erro de rede, tentar buscar direto do banco
        if (error.message?.includes('Failed to fetch')) {
          console.log('⚠️ Falha de rede na edge function, tentando buscar dados diretamente...');
          toast.warning('Falha ao executar monitoramento automático', {
            description: 'Atualizando lista de erros manualmente'
          });
          await fetchErrors();
          return;
        }
        
        throw error;
      }

      console.log('📊 Resultado do monitoramento:', data);

      const monitorResult = data as any;
      if (!monitorResult?.success) {
        throw new Error(monitorResult?.error || 'Monitoramento falhou');
      }

      const result = monitorResult.data;
      console.log('✅ Monitoramento concluído:', {
        total: result.total_found,
        reprocessed: result.reprocessed,
        failed: result.failed
      });

      if (result.total_found === 0) {
        toast.success('Nenhuma transação falhada encontrada', {
          description: 'Todas as transações estão sincronizadas!'
        });
      } else {
        toast.success('Monitoramento executado com sucesso!', {
          description: `Encontrados: ${result.total_found} | Reprocessados: ${result.reprocessed} | Falhas: ${result.failed}`
        });
      }

      // Sempre atualizar a lista no final
      await fetchErrors();
    } catch (error: any) {
      console.error('❌ Erro ao executar monitoramento:', error);
      toast.error('Erro ao executar monitoramento', {
        description: error.message || 'Erro desconhecido'
      });
      
      // Mesmo com erro, atualizar a lista
      await fetchErrors();
    } finally {
      setLoading(false);
    }
  };

  const clearResolvedErrors = async () => {
    setLoading(true);
    try {
      console.log('🧹 Iniciando limpeza de erros resolvidos...');

      // Primeiro, contar quantos erros resolvidos existem
      const { data: resolvedErrors, error: countError } = await supabase
        .from('integration_error_logs')
        .select('id', { count: 'exact', head: false })
        .eq('status', 'resolved');

      if (countError) {
        console.error('❌ Erro ao contar erros resolvidos:', countError);
        throw countError;
      }

      const resolvedCount = resolvedErrors?.length || 0;
      console.log(`📊 Encontrados ${resolvedCount} erros resolvidos`);

      if (resolvedCount === 0) {
        toast.info('Não há erros resolvidos para limpar', {
          description: 'Todos os erros ainda estão pendentes ou falharam'
        });
        setLoading(false);
        return;
      }

      // Deletar os erros resolvidos
      const { error: deleteError } = await supabase
        .from('integration_error_logs')
        .delete()
        .eq('status', 'resolved');

      if (deleteError) {
        console.error('❌ Erro ao deletar erros:', deleteError);
        throw deleteError;
      }

      console.log(`✅ ${resolvedCount} erros limpos com sucesso`);
      toast.success(`${resolvedCount} erro(s) resolvido(s) limpo(s)!`, {
        description: 'A lista foi atualizada'
      });

      // Recarregar a lista
      await fetchErrors();
    } catch (error: any) {
      console.error('❌ Erro ao limpar erros:', error);
      toast.error('Erro ao limpar erros resolvidos', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateOldProductSales = async () => {
    setLoading(true);
    setMigrationResult(null);
    try {
      toast.info('Iniciando migração de vendas antigas...');
      
      const { data, error } = await supabase.functions.invoke('migrate-old-product-sales');

      if (error) throw error;

      const migrationData = data as any;
      if (migrationData?.success) {
        const summary = migrationData.summary;
        setMigrationResult(summary);
        toast.success(
          `Migração concluída: ${summary.migrated} migradas, ${summary.skipped} já existentes, ${summary.failed} falharam de ${summary.total_found} encontradas`
        );
        fetchErrors();
      } else {
        throw new Error(migrationData?.error || 'Erro na migração');
      }
    } catch (error: any) {
      console.error('Erro ao migrar vendas:', error);
      toast.error('Erro ao migrar vendas antigas');
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
              onClick={() => {
                console.log('🔄 Botão Atualizar clicado');
                fetchErrors();
              }}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                console.log('🔄 Botão Executar Novamente clicado');
                runMonitoring();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Executar Novamente
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                console.log('🗑️ Botão Limpar Resolvidos clicado');
                clearResolvedErrors();
              }}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Limpar Resolvidos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Migration Result */}
        {migrationResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Resultado da Migração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold">{migrationResult.total_found}</div>
                  <div className="text-xs text-muted-foreground">Total Encontrado</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{migrationResult.migrated}</div>
                  <div className="text-xs text-muted-foreground">✅ Migrados</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{migrationResult.skipped}</div>
                  <div className="text-xs text-muted-foreground">⏭️ Já Existentes</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{migrationResult.failed}</div>
                  <div className="text-xs text-muted-foreground">❌ Falhas</div>
                </div>
              </div>
              
              {migrationResult.details && migrationResult.details.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Detalhes das Vendas:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {migrationResult.details.map((detail: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded flex justify-between items-center ${
                          detail.status === 'migrated' 
                            ? 'bg-white border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {detail.status === 'migrated' ? '✅' : '❌'}
                          <span className="font-mono text-xs">{detail.venda_id.slice(0, 13)}</span>
                        </div>
                        {detail.status === 'migrated' && detail.total && (
                          <span className="font-semibold text-green-700">
                            R$ {detail.total.toFixed(2)}
                          </span>
                        )}
                        {detail.error && (
                          <span className="text-red-600 text-xs">
                            {detail.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      onClick={() => {
                        console.log('🔄 Reprocessando erro individual:', error.id);
                        handleReprocess(error);
                      }}
                      disabled={reprocessing === error.id}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
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
