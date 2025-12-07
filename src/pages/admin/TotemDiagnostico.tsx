import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Loader2,
  AlertTriangle,
  Usb,
  QrCode,
  Copy
} from 'lucide-react';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { 
  isAndroidTEFAvailable, 
  verificarPinpad, 
  getLogsAndroid, 
  limparLogsAndroid, 
  setModoDebug 
} from '@/lib/tef/tefAndroidBridge';
import { toast } from 'sonner';

interface DiagnosticLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'critical';
  message: string;
  details?: string;
}

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  message: string;
  details?: string;
  action?: string;
}

const TotemDiagnostico: React.FC = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [androidLogs, setAndroidLogs] = useState<string[]>([]);
  const [debugMode, setDebugModeState] = useState(false);
  const [testValue, setTestValue] = useState('1.00');
  const [testPaymentType, setTestPaymentType] = useState<'debit' | 'credit' | 'pix'>('debit');
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [lastDiagnosticTime, setLastDiagnosticTime] = useState<Date | null>(null);

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
      addLog('success', `✅ PAGAMENTO APROVADO!`, `NSU: ${resultado.nsu} | Autorização: ${resultado.autorizacao} | Bandeira: ${resultado.bandeira}`);
      setIsTestingPayment(false);
      toast.success('Pagamento aprovado!', { description: `NSU: ${resultado.nsu}` });
    },
    onError: (erro) => {
      addLog('error', `❌ PAGAMENTO NEGADO/ERRO`, erro);
      setIsTestingPayment(false);
      toast.error('Pagamento falhou', { description: erro });
    },
    onCancelled: () => {
      addLog('warning', '⚠️ Pagamento cancelado pelo usuário ou operador');
      setIsTestingPayment(false);
      toast.info('Pagamento cancelado');
    }
  });

  const addLog = useCallback((type: DiagnosticLog['type'], message: string, details?: string) => {
    setLogs(prev => [{
      timestamp: new Date(),
      type,
      message,
      details
    }, ...prev].slice(0, 200));
  }, []);

  // Diagnóstico completo
  const runFullDiagnostics = useCallback(() => {
    const results: DiagnosticResult[] = [];
    
    addLog('info', '═══════════════════════════════════════');
    addLog('info', '🔍 INICIANDO DIAGNÓSTICO COMPLETO DO TOTEM');
    addLog('info', '═══════════════════════════════════════');
    addLog('info', `📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);

    // ═══════════════════════════════════════════════════════════════
    // TESTE 1: Verificar ambiente (é Android ou navegador comum?)
    // ═══════════════════════════════════════════════════════════════
    const userAgent = navigator.userAgent;
    const isAndroidDevice = /Android/i.test(userAgent);
    const isWebView = /wv|WebView/i.test(userAgent);
    
    addLog('info', `🌐 UserAgent: ${userAgent}`);
    
    if (isAndroidDevice && isWebView) {
      results.push({
        name: 'Ambiente Android WebView',
        status: 'pass',
        message: 'Executando em WebView Android ✓',
        details: userAgent
      });
      addLog('success', '✓ Ambiente: WebView Android detectado');
    } else if (isAndroidDevice) {
      results.push({
        name: 'Ambiente Android WebView',
        status: 'warning',
        message: 'Android detectado, mas não parece ser WebView',
        details: userAgent,
        action: 'Verifique se o app está usando WebView e não o navegador Chrome'
      });
      addLog('warning', '⚠️ Android detectado, mas pode não ser WebView do APK');
    } else {
      results.push({
        name: 'Ambiente Android WebView',
        status: 'fail',
        message: 'NÃO está em ambiente Android',
        details: `UserAgent não contém "Android": ${userAgent}`,
        action: 'Esta página deve ser aberta dentro do APK Android, não no navegador do PC'
      });
      addLog('critical', '❌ CRÍTICO: Não é ambiente Android!');
      addLog('error', '→ Esta página deve ser acessada pelo APK instalado no Totem');
      addLog('error', '→ Se você está no Totem, o APK não está carregando corretamente');
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTE 2: Verificar se window.Android existe (JavascriptInterface)
    // ═══════════════════════════════════════════════════════════════
    const hasAndroidInterface = typeof (window as any).Android !== 'undefined';
    
    if (hasAndroidInterface) {
      const androidMethods = Object.getOwnPropertyNames((window as any).Android);
      results.push({
        name: 'JavascriptInterface (window.Android)',
        status: 'pass',
        message: 'Interface Android nativa encontrada ✓',
        details: `Métodos disponíveis: ${androidMethods.length > 0 ? androidMethods.join(', ') : 'não listáveis'}`
      });
      addLog('success', '✓ window.Android encontrado (addJavascriptInterface funcionou)');
    } else {
      results.push({
        name: 'JavascriptInterface (window.Android)',
        status: 'fail',
        message: 'Interface Android NÃO encontrada',
        details: 'window.Android é undefined',
        action: 'O APK deve chamar: webView.addJavascriptInterface(tefBridge, "Android")'
      });
      addLog('error', '❌ window.Android NÃO encontrado');
      addLog('error', '→ APK deve usar: webView.addJavascriptInterface(bridge, "Android")');
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTE 3: Verificar se window.TEF existe (interface injetada)
    // ═══════════════════════════════════════════════════════════════
    const hasTEFInterface = typeof (window as any).TEF !== 'undefined';
    
    if (hasTEFInterface) {
      const tef = (window as any).TEF;
      const tefMethods = Object.keys(tef);
      const requiredMethods = ['iniciarPagamento', 'cancelarPagamento', 'verificarPinpad', 'setModoDebug', 'getLogs', 'limparLogs'];
      const missingMethods = requiredMethods.filter(m => typeof tef[m] !== 'function');
      
      addLog('success', `✓ window.TEF encontrado com ${tefMethods.length} métodos`);
      addLog('info', `  Métodos: ${tefMethods.join(', ')}`);
      
      if (missingMethods.length === 0) {
        results.push({
          name: 'Interface TEF (window.TEF)',
          status: 'pass',
          message: 'Todos os métodos TEF disponíveis ✓',
          details: tefMethods.join(', ')
        });
      } else {
        results.push({
          name: 'Interface TEF (window.TEF)',
          status: 'warning',
          message: 'TEF encontrado mas faltam métodos',
          details: `Faltando: ${missingMethods.join(', ')}`,
          action: 'Implementar os métodos faltantes no TEFBridge do APK'
        });
        addLog('warning', `⚠️ Métodos faltando: ${missingMethods.join(', ')}`);
      }
    } else {
      results.push({
        name: 'Interface TEF (window.TEF)',
        status: 'fail',
        message: 'Interface TEF NÃO encontrada',
        details: 'window.TEF é undefined - o APK não injetou a interface',
        action: 'O APK deve injetar window.TEF via evaluateJavascript em onPageFinished'
      });
      addLog('error', '❌ window.TEF NÃO encontrado');
      addLog('error', '→ APK deve executar evaluateJavascript para criar window.TEF');
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTE 4: Verificar status do Pinpad
    // ═══════════════════════════════════════════════════════════════
    if (hasTEFInterface) {
      try {
        const rawStatus = (window as any).TEF.verificarPinpad();
        addLog('info', `📡 Resposta bruta do verificarPinpad: ${rawStatus}`);
        
        const status = typeof rawStatus === 'string' ? JSON.parse(rawStatus) : rawStatus;
        
        if (status && typeof status === 'object') {
          // Verificar se é MOCK
          const isMock = status.modelo?.includes('MOCK') || status.modelo?.includes('mock');
          
          if (isMock) {
            results.push({
              name: 'Pinpad / SDK PayGo',
              status: 'fail',
              message: 'MODO MOCK DETECTADO - NÃO É O SDK REAL!',
              details: `Modelo retornado: ${status.modelo}`,
              action: 'O APK está usando dados mock em vez do SDK PayGo real'
            });
            addLog('critical', '❌ CRÍTICO: Pinpad está em MODO MOCK!');
            addLog('error', '→ Isso significa que o SDK PayGo NÃO está integrado');
            addLog('error', '→ O APK precisa chamar o SDK PayGo real, não simular dados');
          } else if (status.conectado === true) {
            results.push({
              name: 'Pinpad / SDK PayGo',
              status: 'pass',
              message: `Pinpad conectado: ${status.modelo || 'Modelo não informado'}`,
              details: JSON.stringify(status)
            });
            addLog('success', `✓ Pinpad REAL conectado: ${status.modelo}`);
          } else {
            results.push({
              name: 'Pinpad / SDK PayGo',
              status: 'warning',
              message: 'Pinpad não conectado',
              details: JSON.stringify(status),
              action: 'Verifique a conexão USB do pinpad e se o SDK PayGo foi inicializado'
            });
            addLog('warning', '⚠️ Pinpad não conectado');
            addLog('info', '→ Verifique cabo USB do pinpad');
            addLog('info', '→ Verifique se SDK PayGo foi inicializado');
          }
        } else {
          results.push({
            name: 'Pinpad / SDK PayGo',
            status: 'fail',
            message: 'Resposta inválida do verificarPinpad',
            details: `Resposta: ${JSON.stringify(status)}`,
            action: 'verificarPinpad() deve retornar JSON com {conectado, modelo, timestamp}'
          });
          addLog('error', '❌ Resposta inválida do verificarPinpad');
        }
      } catch (e: any) {
        results.push({
          name: 'Pinpad / SDK PayGo',
          status: 'fail',
          message: 'Erro ao verificar pinpad',
          details: e.message,
          action: 'verificarPinpad() lançou uma exceção - verificar implementação no APK'
        });
        addLog('error', `❌ Erro ao chamar verificarPinpad: ${e.message}`);
      }
    } else {
      results.push({
        name: 'Pinpad / SDK PayGo',
        status: 'unknown',
        message: 'Não foi possível verificar (window.TEF não existe)',
        action: 'Primeiro corrija a injeção de window.TEF'
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTE 5: Testar callback de resultado
    // ═══════════════════════════════════════════════════════════════
    const hasCallback = typeof (window as any).onTefResultado !== 'undefined' || true; // Callback é registrado dinamicamente
    results.push({
      name: 'Callback de Resultado',
      status: 'pass',
      message: 'Callback será registrado quando iniciar pagamento',
      details: 'window.onTefResultado será definido pelo hook useTEFAndroid'
    });

    // ═══════════════════════════════════════════════════════════════
    // Resumo Final
    // ═══════════════════════════════════════════════════════════════
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warnCount = results.filter(r => r.status === 'warning').length;
    
    addLog('info', '═══════════════════════════════════════');
    addLog('info', '📊 RESUMO DO DIAGNÓSTICO');
    addLog('info', `  ✓ Passou: ${passCount}`);
    addLog('info', `  ⚠ Avisos: ${warnCount}`);
    addLog('info', `  ❌ Falhas: ${failCount}`);
    addLog('info', '═══════════════════════════════════════');

    if (failCount > 0) {
      addLog('critical', '🚫 TOTEM NÃO ESTÁ PRONTO PARA PAGAMENTOS');
      addLog('error', '→ Corrija os erros acima antes de usar');
    } else if (warnCount > 0) {
      addLog('warning', '⚠️ Totem parcialmente configurado');
    } else {
      addLog('success', '✅ TOTEM PRONTO PARA PAGAMENTOS!');
    }

    setDiagnosticResults(results);
    setLastDiagnosticTime(new Date());
  }, [addLog]);

  // Executar diagnóstico inicial
  useEffect(() => {
    runFullDiagnostics();
  }, []);

  const handleRefreshLogs = () => {
    try {
      const logs = getLogsAndroid();
      setAndroidLogs(logs);
      addLog('info', `Logs Android carregados: ${logs.length} entradas`);
    } catch (e: any) {
      addLog('error', `Erro ao carregar logs: ${e.message}`);
    }
  };

  const handleClearLogs = () => {
    try {
      limparLogsAndroid();
      setAndroidLogs([]);
      setLogs([]);
      addLog('info', 'Logs limpos');
    } catch (e: any) {
      addLog('error', `Erro ao limpar logs: ${e.message}`);
    }
  };

  const handleToggleDebug = () => {
    const newValue = !debugMode;
    const success = setModoDebug(newValue);
    if (success) {
      setDebugModeState(newValue);
      addLog('info', `Modo debug ${newValue ? 'ATIVADO' : 'desativado'}`);
    } else {
      addLog('error', 'Falha ao alterar modo debug - TEF não disponível');
    }
  };

  const handleTestConnection = () => {
    addLog('info', '🔄 Testando conexão com pinpad...');
    const status = verificarConexao();
    if (status) {
      addLog(status.conectado ? 'success' : 'warning', 
        `Pinpad: ${status.conectado ? 'CONECTADO' : 'DESCONECTADO'} - Modelo: ${status.modelo || 'N/A'}`);
    } else {
      addLog('error', 'Não foi possível verificar status do pinpad');
    }
  };

  const handleTestPayment = async () => {
    const valor = parseFloat(testValue);
    if (isNaN(valor) || valor <= 0) {
      addLog('error', 'Valor inválido para teste');
      toast.error('Valor inválido');
      return;
    }

    if (!isAndroidAvailable) {
      addLog('error', 'TEF Android não disponível - não é possível testar pagamento');
      toast.error('TEF não disponível');
      return;
    }

    if (!isPinpadConnected) {
      addLog('error', 'Pinpad não conectado - não é possível testar pagamento');
      toast.error('Pinpad não conectado');
      return;
    }

    setIsTestingPayment(true);
    addLog('info', '═══════════════════════════════════════');
    addLog('info', `💳 INICIANDO PAGAMENTO DE TESTE`);
    addLog('info', `  Tipo: ${testPaymentType.toUpperCase()}`);
    addLog('info', `  Valor: R$ ${valor.toFixed(2)}`);
    addLog('info', `  Ordem: TESTE-${Date.now()}`);
    addLog('info', '═══════════════════════════════════════');
    
    const success = await iniciarPagamento({
      ordemId: `TESTE-${Date.now()}`,
      valor,
      tipo: testPaymentType
    });

    if (!success) {
      addLog('error', 'Falha ao iniciar pagamento - verifique logs acima');
      setIsTestingPayment(false);
    } else {
      addLog('info', '⏳ Aguardando resposta do pinpad...');
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamento();
    addLog('warning', 'Cancelamento solicitado');
  };

  const copyDiagnosticReport = () => {
    const report = logs.map(l => 
      `[${l.timestamp.toLocaleTimeString()}] ${l.message}${l.details ? ` | ${l.details}` : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(report);
    toast.success('Relatório copiado para área de transferência');
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLogIcon = (type: DiagnosticLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      default: return <Terminal className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };

  const overallStatus = diagnosticResults.some(r => r.status === 'fail') ? 'fail' :
                        diagnosticResults.some(r => r.status === 'warning') ? 'warning' : 'pass';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔧 Diagnóstico do Totem TEF</h1>
            <p className="text-gray-400 text-sm">
              Verificação completa da integração PayGo
              {lastDiagnosticTime && ` • Último: ${lastDiagnosticTime.toLocaleTimeString()}`}
            </p>
          </div>
          <Badge 
            variant={overallStatus === 'pass' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'}
            className="text-lg px-4 py-2"
          >
            {overallStatus === 'pass' ? '✓ PRONTO' : overallStatus === 'warning' ? '⚠ ATENÇÃO' : '✗ ERRO'}
          </Badge>
        </div>

        {/* Status Cards Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`${isAndroidAvailable ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Smartphone className={isAndroidAvailable ? 'text-green-500' : 'text-red-500'} size={28} />
              <div>
                <p className="text-xs text-gray-400">TEF Android</p>
                <p className={`font-bold ${isAndroidAvailable ? 'text-green-400' : 'text-red-400'}`}>
                  {isAndroidAvailable ? 'CONECTADO' : 'NÃO CONECTADO'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isPinpadConnected ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Usb className={isPinpadConnected ? 'text-green-500' : 'text-red-500'} size={28} />
              <div>
                <p className="text-xs text-gray-400">Pinpad</p>
                <p className={`font-bold ${isPinpadConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isPinpadConnected ? (pinpadStatus?.modelo || 'CONECTADO') : 'DESCONECTADO'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isProcessing ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700 bg-gray-800/50'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className={isProcessing ? 'text-yellow-500 animate-pulse' : 'text-gray-500'} size={28} />
              <div>
                <p className="text-xs text-gray-400">Pagamento</p>
                <p className={`font-bold ${isProcessing ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {isProcessing ? 'PROCESSANDO' : 'AGUARDANDO'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${debugMode ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700 bg-gray-800/50'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Bug className={debugMode ? 'text-yellow-500' : 'text-gray-500'} size={28} />
              <div>
                <p className="text-xs text-gray-400">Debug</p>
                <p className={`font-bold ${debugMode ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {debugMode ? 'ATIVADO' : 'DESATIVADO'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultados do Diagnóstico */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Resultados do Diagnóstico
            </CardTitle>
            <CardDescription>Verificação detalhada de cada componente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosticResults.map((result, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg border ${
                  result.status === 'pass' ? 'border-green-500/30 bg-green-500/5' :
                  result.status === 'fail' ? 'border-red-500/30 bg-red-500/5' :
                  result.status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-semibold">{result.name}</p>
                    <p className={`text-sm ${
                      result.status === 'pass' ? 'text-green-400' :
                      result.status === 'fail' ? 'text-red-400' :
                      result.status === 'warning' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-1 font-mono break-all">{result.details}</p>
                    )}
                    {result.action && (
                      <p className="text-xs text-blue-400 mt-2">💡 Ação: {result.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Button onClick={runFullDiagnostics} className="w-full mt-4" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Executar Diagnóstico Novamente
            </Button>
          </CardContent>
        </Card>

        {/* Ações de Teste */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle>🧪 Teste de Pagamento Real</CardTitle>
            <CardDescription>
              Execute uma transação real via PayGo (use valor pequeno em homologação)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  disabled={isTestingPayment}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Tipo de Pagamento</Label>
                <div className="flex gap-2 mt-1">
                  {(['debit', 'credit', 'pix'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={testPaymentType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTestPaymentType(type)}
                      disabled={isTestingPayment}
                    >
                      {type === 'debit' ? 'Débito' : type === 'credit' ? 'Crédito' : 'PIX'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                {!isTestingPayment ? (
                  <Button 
                    onClick={handleTestPayment}
                    disabled={!isAndroidAvailable || !isPinpadConnected}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Pagamento
                  </Button>
                ) : (
                  <Button onClick={handleCancelPayment} variant="destructive" className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {isTestingPayment && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-400">Aguardando resposta do pinpad...</p>
                  <p className="text-sm text-gray-400">Siga as instruções na tela do pinpad</p>
                </div>
              </div>
            )}

            {(!isAndroidAvailable || !isPinpadConnected) && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-semibold">
                  ⚠️ Pagamento desabilitado: {!isAndroidAvailable ? 'TEF não conectado' : 'Pinpad não conectado'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ferramentas */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle>🛠️ Ferramentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleTestConnection} variant="outline" size="sm">
                <Wifi className="w-4 h-4 mr-2" />
                Testar Conexão Pinpad
              </Button>
              <Button onClick={handleToggleDebug} variant="outline" size="sm">
                <Bug className="w-4 h-4 mr-2" />
                {debugMode ? 'Desativar Debug' : 'Ativar Debug'}
              </Button>
              <Button onClick={handleRefreshLogs} variant="outline" size="sm">
                <Terminal className="w-4 h-4 mr-2" />
                Carregar Logs Android
              </Button>
              <Button onClick={handleClearLogs} variant="outline" size="sm">
                Limpar Logs
              </Button>
              <Button onClick={copyDiagnosticReport} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs de Diagnóstico */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Logs de Diagnóstico
            </CardTitle>
            <CardDescription>{logs.length} entradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 border border-gray-700 rounded-lg p-3 bg-black/50 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum log registrado</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {getLogIcon(log.type)}
                      <span className="text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                      <span className={
                        log.type === 'critical' ? 'text-red-400 font-bold' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }>
                        {log.message}
                      </span>
                      {log.details && (
                        <span className="text-gray-500 break-all">| {log.details}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Logs do Android */}
        {androidLogs.length > 0 && (
          <Card className="border-gray-700 bg-gray-900/50">
            <CardHeader>
              <CardTitle>📱 Logs do Android (SDK)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 border border-gray-700 rounded-lg p-3 bg-black/50">
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                  {androidLogs.join('\n')}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TotemDiagnostico;
