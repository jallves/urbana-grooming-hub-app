import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  CreditCard, 
  RefreshCw, 
  Play, 
  Square, 
  Bug,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Loader2
} from 'lucide-react';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { 
  isAndroidTEFAvailable, 
  verificarPinpad, 
  getLogsAndroid, 
  limparLogsAndroid, 
  setModoDebug 
} from '@/lib/tef/tefAndroidBridge';

interface DiagnosticLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const TotemDiagnostico: React.FC = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [androidLogs, setAndroidLogs] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [testValue, setTestValue] = useState('1.00');
  const [isTestingPayment, setIsTestingPayment] = useState(false);

  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing,
    pinpadStatus,
    androidVersion,
    iniciarPagamento,
    cancelarPagamento,
    verificarConexao
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      addLog('success', `Pagamento aprovado! NSU: ${resultado.nsu}`);
      setIsTestingPayment(false);
    },
    onError: (erro) => {
      addLog('error', `Erro no pagamento: ${erro}`);
      setIsTestingPayment(false);
    },
    onCancelled: () => {
      addLog('warning', 'Pagamento cancelado pelo usuário');
      setIsTestingPayment(false);
    }
  });

  const addLog = (type: DiagnosticLog['type'], message: string) => {
    setLogs(prev => [{
      timestamp: new Date(),
      type,
      message
    }, ...prev].slice(0, 100));
  };

  // Diagnóstico inicial
  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    addLog('info', '=== Iniciando diagnóstico do Totem ===');
    
    // 1. Verificar se window.TEF existe
    const tefExists = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';
    if (tefExists) {
      addLog('success', '✓ window.TEF encontrado');
      
      // Listar métodos disponíveis
      const tef = (window as any).TEF;
      const methods = Object.keys(tef);
      addLog('info', `Métodos disponíveis: ${methods.join(', ')}`);
    } else {
      addLog('error', '✗ window.TEF NÃO encontrado');
      addLog('info', 'O APK Android precisa injetar a interface TEF no WebView');
    }

    // 2. Verificar hook
    addLog('info', `isAndroidTEFAvailable(): ${isAndroidTEFAvailable()}`);
    
    // 3. Verificar pinpad
    if (tefExists) {
      const status = verificarPinpad();
      if (status) {
        addLog('info', `Status Pinpad: ${JSON.stringify(status)}`);
        if (status.conectado) {
          addLog('success', `✓ Pinpad conectado - Modelo: ${status.modelo || 'N/A'}`);
        } else {
          addLog('warning', '✗ Pinpad não conectado');
        }
      }
    }

    // 4. Verificar UserAgent
    addLog('info', `UserAgent: ${navigator.userAgent}`);
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    if (isAndroidDevice) {
      addLog('success', '✓ Executando em dispositivo Android');
    } else {
      addLog('warning', '✗ Não parece ser um dispositivo Android');
    }

    addLog('info', '=== Diagnóstico concluído ===');
  };

  const handleRefreshLogs = () => {
    const logs = getLogsAndroid();
    setAndroidLogs(logs);
    addLog('info', `Logs Android carregados: ${logs.length} entradas`);
  };

  const handleClearLogs = () => {
    limparLogsAndroid();
    setAndroidLogs([]);
    addLog('info', 'Logs Android limpos');
  };

  const handleToggleDebug = () => {
    const newValue = !debugMode;
    const success = setModoDebug(newValue);
    if (success) {
      setDebugMode(newValue);
      addLog('info', `Modo debug ${newValue ? 'ativado' : 'desativado'}`);
    } else {
      addLog('error', 'Falha ao alterar modo debug');
    }
  };

  const handleTestConnection = () => {
    addLog('info', 'Testando conexão com pinpad...');
    const status = verificarConexao();
    if (status) {
      addLog(status.conectado ? 'success' : 'warning', 
        `Pinpad: ${status.conectado ? 'Conectado' : 'Desconectado'}`);
    } else {
      addLog('error', 'Não foi possível verificar status do pinpad');
    }
  };

  const handleTestPayment = async () => {
    const valor = parseFloat(testValue);
    if (isNaN(valor) || valor <= 0) {
      addLog('error', 'Valor inválido para teste');
      return;
    }

    setIsTestingPayment(true);
    addLog('info', `Iniciando pagamento de teste: R$ ${valor.toFixed(2)}`);
    
    const success = await iniciarPagamento({
      ordemId: `TESTE-${Date.now()}`,
      valor,
      tipo: 'debit'
    });

    if (!success) {
      setIsTestingPayment(false);
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamento();
    addLog('warning', 'Cancelamento solicitado');
  };

  const handleInjectMock = () => {
    // Injetar mock para testes sem APK
    addLog('warning', 'Injetando mock TEF para testes...');
    
    (window as any).TEF = {
      iniciarPagamento: (jsonParams: string) => {
        console.log('[MOCK TEF] iniciarPagamento:', jsonParams);
        addLog('info', `[MOCK] iniciarPagamento: ${jsonParams}`);
        
        // Simular resposta após 2s
        setTimeout(() => {
          const params = JSON.parse(jsonParams);
          if ((window as any).onTefResultado) {
            (window as any).onTefResultado({
              status: 'aprovado',
              valor: params.valorCentavos,
              nsu: '123456789',
              autorizacao: 'AUTH123',
              bandeira: 'VISA',
              ordemId: params.ordemId,
              timestamp: Date.now()
            });
          }
        }, 2000);
      },
      cancelarPagamento: () => {
        console.log('[MOCK TEF] cancelarPagamento');
        addLog('info', '[MOCK] cancelarPagamento');
      },
      verificarPinpad: () => {
        return JSON.stringify({
          conectado: true,
          modelo: 'PPC930 (MOCK)',
          timestamp: Date.now()
        });
      },
      setModoDebug: (enabled: boolean) => {
        console.log('[MOCK TEF] setModoDebug:', enabled);
        addLog('info', `[MOCK] setModoDebug: ${enabled}`);
      },
      getLogs: () => {
        return JSON.stringify({ logs: ['[MOCK] Log de teste'] });
      },
      limparLogs: () => {
        console.log('[MOCK TEF] limparLogs');
      }
    };

    // Disparar evento de ready
    window.dispatchEvent(new CustomEvent('tefAndroidReady', {
      detail: { version: '1.0.0-MOCK' }
    }));

    addLog('success', 'Mock TEF injetado com sucesso!');
    runDiagnostics();
  };

  const getLogIcon = (type: DiagnosticLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico do Totem TEF</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Smartphone className={isAndroidAvailable ? 'text-green-500' : 'text-red-500'} />
            <div>
              <p className="text-sm text-muted-foreground">Android TEF</p>
              <Badge variant={isAndroidAvailable ? 'default' : 'destructive'}>
                {isAndroidAvailable ? 'Disponível' : 'Indisponível'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {isPinpadConnected ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
            <div>
              <p className="text-sm text-muted-foreground">Pinpad</p>
              <Badge variant={isPinpadConnected ? 'default' : 'destructive'}>
                {isPinpadConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className={isProcessing ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'} />
            <div>
              <p className="text-sm text-muted-foreground">Pagamento</p>
              <Badge variant={isProcessing ? 'secondary' : 'outline'}>
                {isProcessing ? 'Processando' : 'Aguardando'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bug className={debugMode ? 'text-yellow-500' : 'text-muted-foreground'} />
            <div>
              <p className="text-sm text-muted-foreground">Debug</p>
              <Badge variant={debugMode ? 'secondary' : 'outline'}>
                {debugMode ? 'Ativado' : 'Desativado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      {(androidVersion || pinpadStatus) && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {androidVersion && (
                <div>
                  <span className="text-muted-foreground">Versão Android TEF:</span>
                  <span className="ml-2 font-mono">{androidVersion}</span>
                </div>
              )}
              {pinpadStatus?.modelo && (
                <div>
                  <span className="text-muted-foreground">Modelo Pinpad:</span>
                  <span className="ml-2 font-mono">{pinpadStatus.modelo}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Ações de Diagnóstico</CardTitle>
          <CardDescription>Ferramentas para testar a conexão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runDiagnostics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Executar Diagnóstico
            </Button>
            
            <Button onClick={handleTestConnection} variant="outline">
              <Wifi className="w-4 h-4 mr-2" />
              Testar Conexão
            </Button>

            <Button onClick={handleToggleDebug} variant="outline">
              <Bug className="w-4 h-4 mr-2" />
              {debugMode ? 'Desativar Debug' : 'Ativar Debug'}
            </Button>

            <Button onClick={handleRefreshLogs} variant="outline">
              <Terminal className="w-4 h-4 mr-2" />
              Carregar Logs Android
            </Button>

            <Button onClick={handleClearLogs} variant="outline">
              Limpar Logs
            </Button>

            {!isAndroidAvailable && (
              <Button onClick={handleInjectMock} variant="secondary">
                <Play className="w-4 h-4 mr-2" />
                Injetar Mock TEF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teste de Pagamento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Teste de Pagamento</CardTitle>
          <CardDescription>Simule uma transação para validar a integração</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="testValue">Valor (R$)</Label>
              <Input
                id="testValue"
                type="number"
                step="0.01"
                min="0.01"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                disabled={isTestingPayment}
              />
            </div>
            
            {!isTestingPayment ? (
              <Button 
                onClick={handleTestPayment}
                disabled={!isAndroidAvailable || !isPinpadConnected}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Pagamento
              </Button>
            ) : (
              <Button onClick={handleCancelPayment} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>

          {isTestingPayment && (
            <div className="mt-4 p-4 bg-muted rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando pagamento... Siga as instruções no pinpad.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logs de Diagnóstico</CardTitle>
          <CardDescription>Histórico de eventos e diagnósticos</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 border rounded-lg p-3">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum log registrado
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm font-mono">
                    {getLogIcon(log.type)}
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={
                      log.type === 'error' ? 'text-red-500' :
                      log.type === 'success' ? 'text-green-500' :
                      log.type === 'warning' ? 'text-yellow-500' :
                      ''
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Logs do Android */}
      {androidLogs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Logs do Android</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 border rounded-lg p-3 bg-muted">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {androidLogs.join('\n')}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Instruções para o Desenvolvedor Android</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>O APK Android deve injetar a interface <code>window.TEF</code> no WebView:</p>
          <pre className="bg-muted p-3 rounded text-xs overflow-auto">{`
// No WebViewClient.onPageFinished():
webView.evaluateJavascript("""
  window.TEF = {
    iniciarPagamento: function(json) { Android.iniciarPagamento(json); },
    cancelarPagamento: function() { Android.cancelarPagamento(); },
    verificarPinpad: function() { return Android.verificarPinpad(); },
    setModoDebug: function(enabled) { Android.setModoDebug(enabled); },
    getLogs: function() { return Android.getLogs(); },
    limparLogs: function() { Android.limparLogs(); }
  };
  window.dispatchEvent(new CustomEvent('tefAndroidReady', { detail: { version: '1.0.0' } }));
""".trimIndent(), null)

// Para enviar resultado de pagamento:
webView.evaluateJavascript("""
  if (window.onTefResultado) {
    window.onTefResultado($resultadoJson);
  }
""".trimIndent(), null)
          `}</pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TotemDiagnostico;
