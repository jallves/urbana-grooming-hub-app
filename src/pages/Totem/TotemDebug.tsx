import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Terminal,
  Play,
  Bug
} from 'lucide-react';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { 
  isAndroidTEFAvailable, 
  verificarPinpad, 
  getLogsAndroid, 
  limparLogsAndroid,
  setModoDebug
} from '@/lib/tef/tefAndroidBridge';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const TotemDebug: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [androidLogs, setAndroidLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testPaymentValue, setTestPaymentValue] = useState(1);
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    windowTEF: 'Verificando...',
    windowAndroid: 'Verificando...',
    timestamp: new Date().toISOString(),
  });

  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing,
    pinpadStatus,
    androidVersion,
    iniciarPagamento,
    verificarConexao
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      addLog(`✅ PAGAMENTO APROVADO! NSU: ${resultado.nsu}`, 'success');
    },
    onError: (erro) => {
      addLog(`❌ ERRO: ${erro}`, 'error');
    },
    onCancelled: () => {
      addLog('⚠️ Pagamento cancelado pelo usuário', 'warning');
    }
  });

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [...prev.slice(-99), { timestamp, message, type }]);
  }, []);

  const updateDebugInfo = useCallback(() => {
    // @ts-ignore
    const tefType = typeof window.TEF;
    // @ts-ignore
    const androidType = typeof window.Android;
    
    setDebugInfo({
      userAgent: navigator.userAgent,
      windowTEF: tefType === 'undefined' ? '❌ undefined' : `✅ ${tefType}`,
      windowAndroid: androidType === 'undefined' ? '❌ undefined' : `✅ ${androidType}`,
      timestamp: new Date().toISOString(),
    });

    addLog(`[DEBUG] window.TEF: ${tefType}`, tefType === 'undefined' ? 'error' : 'success');
    addLog(`[DEBUG] window.Android: ${androidType}`, androidType === 'undefined' ? 'warning' : 'success');
    addLog(`[DEBUG] isAndroidAvailable: ${isAndroidAvailable}`, isAndroidAvailable ? 'success' : 'error');
    addLog(`[DEBUG] isPinpadConnected: ${isPinpadConnected}`, isPinpadConnected ? 'success' : 'warning');
    
    // Verificar pinpad diretamente
    const status = verificarPinpad();
    if (status) {
      addLog(`[PINPAD] Status: ${JSON.stringify(status)}`, status.conectado ? 'success' : 'warning');
    } else {
      addLog('[PINPAD] Não foi possível verificar status', 'error');
    }
  }, [addLog, isAndroidAvailable, isPinpadConnected]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    addLog('🔄 Atualizando informações...', 'info');
    
    updateDebugInfo();
    verificarConexao();
    
    // Buscar logs do Android
    try {
      const logsFromAndroid = getLogsAndroid();
      setAndroidLogs(logsFromAndroid);
      addLog(`[LOGS] ${logsFromAndroid.length} logs do Android carregados`, 'info');
    } catch (e) {
      addLog(`[LOGS] Erro ao buscar logs: ${e}`, 'error');
    }
    
    setTimeout(() => setIsRefreshing(false), 500);
  }, [addLog, updateDebugInfo, verificarConexao]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setAndroidLogs([]);
    limparLogsAndroid();
    addLog('🗑️ Logs limpos', 'info');
  }, [addLog]);

  const enableDebugMode = useCallback(() => {
    const success = setModoDebug(true);
    addLog(`[DEBUG] Modo debug ${success ? 'ativado' : 'falhou'}`, success ? 'success' : 'error');
  }, [addLog]);

  const testPayment = useCallback(async () => {
    addLog(`[TEST] Iniciando pagamento de teste: R$ ${testPaymentValue.toFixed(2)}`, 'info');
    
    const ordemId = `TEST_${Date.now()}`;
    addLog(`[TEST] Ordem ID: ${ordemId}`, 'info');
    
    const success = await iniciarPagamento({
      ordemId,
      valor: testPaymentValue,
      tipo: 'credit',
      parcelas: 1
    });
    
    if (!success) {
      addLog('[TEST] Falha ao iniciar pagamento', 'error');
    }
  }, [testPaymentValue, iniciarPagamento, addLog]);

  useEffect(() => {
    addLog('🚀 Tela de Debug iniciada', 'info');
    updateDebugInfo();
    enableDebugMode();
  }, []);

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const status = verificarPinpad();
      if (status) {
        // Só loga se houve mudança
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/totem/home')}
          className="text-white"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bug className="h-6 w-6" />
          Debug TEF
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="text-white border-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearLogs}
            className="text-white border-white/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Android TEF</p>
              <div className="flex items-center gap-1">
                {isAndroidAvailable ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Disponível</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">Indisponível</span>
                  </>
                )}
              </div>
              {androidVersion && (
                <p className="text-xs text-gray-500">v{androidVersion}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Pinpad</p>
              <div className="flex items-center gap-1">
                {isPinpadConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">Desconectado</span>
                  </>
                )}
              </div>
              {pinpadStatus?.modelo && (
                <p className="text-xs text-gray-500">{pinpadStatus.modelo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            {debugInfo.windowTEF.includes('✅') ? (
              <Wifi className="h-8 w-8 text-green-400" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-400" />
            )}
            <div>
              <p className="text-xs text-gray-400">window.TEF</p>
              <p className={`font-medium ${debugInfo.windowTEF.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {debugInfo.windowTEF.includes('✅') ? 'Injetado' : 'Ausente'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            {isProcessing ? (
              <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <p className="text-xs text-gray-400">Processamento</p>
              <p className={`font-medium ${isProcessing ? 'text-yellow-400' : 'text-gray-400'}`}>
                {isProcessing ? 'Em andamento' : 'Livre'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="bg-gray-800 border-gray-700 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs font-mono space-y-1">
          <p><span className="text-gray-500">User Agent:</span> {debugInfo.userAgent.substring(0, 80)}...</p>
          <p><span className="text-gray-500">window.TEF:</span> {debugInfo.windowTEF}</p>
          <p><span className="text-gray-500">window.Android:</span> {debugInfo.windowAndroid}</p>
          <p><span className="text-gray-500">Última verificação:</span> {debugInfo.timestamp}</p>
        </CardContent>
      </Card>

      {/* Test Payment */}
      <Card className="bg-gray-800 border-gray-700 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4" />
            Teste de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">R$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={testPaymentValue}
                onChange={(e) => setTestPaymentValue(parseFloat(e.target.value) || 0.01)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-24 text-white"
              />
            </div>
            <Button
              onClick={testPayment}
              disabled={isProcessing || !isAndroidAvailable}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-1" />
              Testar Pagamento
            </Button>
            {!isAndroidAvailable && (
              <Badge variant="destructive">TEF não disponível</Badge>
            )}
            {!isPinpadConnected && isAndroidAvailable && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                Pinpad desconectado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Frontend Logs */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Logs Frontend ({logs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Nenhum log ainda...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`${getLogColor(log.type)}`}>
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Android Logs */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Logs Android ({androidLogs.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const logsFromAndroid = getLogsAndroid();
                  setAndroidLogs(logsFromAndroid);
                }}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="font-mono text-xs space-y-1">
                {androidLogs.length === 0 ? (
                  <p className="text-gray-500">
                    {isAndroidAvailable 
                      ? 'Clique em Atualizar para carregar logs...'
                      : 'TEF não disponível - logs indisponíveis'}
                  </p>
                ) : (
                  androidLogs.map((log, i) => (
                    <div key={i} className="text-gray-300">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const status = verificarConexao();
            addLog(`[MANUAL] Verificação: ${JSON.stringify(status)}`, status?.conectado ? 'success' : 'warning');
          }}
          className="text-white border-white/20"
        >
          Verificar Pinpad
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={enableDebugMode}
          className="text-white border-white/20"
        >
          Ativar Debug Mode
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // @ts-ignore
            if (window.TEF?.verificarPayGo) {
              // @ts-ignore
              const info = window.TEF.verificarPayGo();
              addLog(`[PAYGO] Info: ${info}`, 'info');
            } else {
              addLog('[PAYGO] Método verificarPayGo não disponível', 'error');
            }
          }}
          className="text-white border-white/20"
        >
          Info PayGo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // @ts-ignore
            if (window.TEF?.getStatus) {
              // @ts-ignore
              const status = window.TEF.getStatus();
              addLog(`[STATUS] Full: ${status}`, 'info');
            } else {
              addLog('[STATUS] Método getStatus não disponível', 'error');
            }
          }}
          className="text-white border-white/20"
        >
          Status Completo
        </Button>
      </div>
    </div>
  );
};

export default TotemDebug;
