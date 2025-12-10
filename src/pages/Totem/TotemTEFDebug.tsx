import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Play,
  Terminal,
  Wifi,
  WifiOff,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { 
  isAndroidTEFAvailable, 
  getLogsAndroid, 
  setModoDebug,
  limparLogsAndroid 
} from '@/lib/tef/tefAndroidBridge';

interface TEFStatus {
  pinpad: {
    conectado: boolean;
    modelo: string;
  };
  paygo: {
    installed: boolean;
    version: string;
    packageName: string;
  };
  pendingTransaction: string | null;
  debugMode: boolean;
  logsCount: number;
}

export default function TotemTEFDebug() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<TEFStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [testAmount, setTestAmount] = useState(100); // R$ 1,00
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isAndroidAvailable, 
    isPinpadConnected, 
    isProcessing,
    iniciarPagamento,
    verificarConexao
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      console.log('[Debug] Pagamento aprovado:', resultado);
      refreshLogs();
    },
    onError: (erro) => {
      console.log('[Debug] Erro no pagamento:', erro);
      refreshLogs();
    },
    onCancelled: () => {
      console.log('[Debug] Pagamento cancelado');
      refreshLogs();
    }
  });

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshLogs();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshLogs = () => {
    if (!isAndroidTEFAvailable()) return;
    
    const newLogs = getLogsAndroid();
    setLogs(newLogs);
  };

  const refreshStatus = () => {
    if (!isAndroidTEFAvailable()) return;
    
    try {
      // @ts-ignore - window.TEF is injected by Android
      const statusJson = window.TEF?.getStatus?.();
      if (statusJson) {
        const parsed = JSON.parse(statusJson);
        setStatus(parsed);
      }
    } catch (error) {
      console.error('Erro ao obter status:', error);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    
    refreshLogs();
    refreshStatus();
    verificarConexao();
    
    setIsRefreshing(false);
  };

  const clearLogs = () => {
    limparLogsAndroid();
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tef-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const testPayment = async (method: 'debito' | 'credito' | 'pix') => {
    const testOrderId = `TEST_${Date.now()}`;
    
    console.log(`[Debug] Iniciando pagamento teste: ${method}, valor: R$ ${testAmount / 100}`);
    
    await iniciarPagamento({
      ordemId: testOrderId,
      valor: testAmount / 100, // Converter centavos para reais
      tipo: method === 'debito' ? 'debit' : method === 'credito' ? 'credit' : 'pix',
      parcelas: 1
    });
  };

  const getLogLineColor = (log: string) => {
    if (log.includes('✅') || log.includes('aprovado') || log.includes('APROVADO')) {
      return 'text-green-400';
    }
    if (log.includes('❌') || log.includes('ERRO') || log.includes('negado')) {
      return 'text-red-400';
    }
    if (log.includes('⚠️') || log.includes('WARN')) {
      return 'text-yellow-400';
    }
    if (log.includes('[TXN]')) {
      return 'text-blue-400';
    }
    if (log.includes('[RESP]')) {
      return 'text-purple-400';
    }
    if (log.includes('[USB]') || log.includes('[PINPAD]')) {
      return 'text-cyan-400';
    }
    if (log.includes('[PAYGO]')) {
      return 'text-orange-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/totem')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">TEF Debug Console</h1>
            <p className="text-sm text-gray-400">Diagnóstico de integração PayGo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Panel */}
        <div className="space-y-4">
          {/* Android/WebView Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Status da Integração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Android WebView</span>
                {isAndroidAvailable ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Disponível
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não disponível
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Pinpad</span>
                {isPinpadConnected ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <Wifi className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Desconectado
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">PayGo Instalado</span>
                {status?.paygo?.installed ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    v{status.paygo.version}
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não instalado
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Processando</span>
                {isProcessing ? (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Sim
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400">
                    Não
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Payment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Teste de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Valor (centavos)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  = R$ {(testAmount / 100).toFixed(2)}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testPayment('debito')}
                  disabled={isProcessing || !isAndroidAvailable}
                  className="text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Débito
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testPayment('credito')}
                  disabled={isProcessing || !isAndroidAvailable}
                  className="text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Crédito
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testPayment('pix')}
                  disabled={isProcessing || !isAndroidAvailable}
                  className="text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  PIX
                </Button>
              </div>
              
              {!isAndroidAvailable && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Disponível apenas no Android
                </p>
              )}
            </CardContent>
          </Card>

          {/* Log Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Controles de Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Auto-refresh</span>
                <Button
                  size="sm"
                  variant={autoRefresh ? 'default' : 'outline'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="h-7"
                >
                  {autoRefresh ? 'Ligado' : 'Desligado'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadLogs}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearLogs}
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                {logs.length} linhas de log
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700 h-[calc(100vh-120px)]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Logs do PayGoService
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {logs.length} linhas
              </Badge>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              <ScrollArea className="h-full">
                <div className="font-mono text-xs space-y-0.5 pr-4">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      {isAndroidAvailable ? (
                        <>
                          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum log disponível</p>
                          <p className="text-xs">Execute uma ação para ver os logs</p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                          <p>Android TEF não disponível</p>
                          <p className="text-xs">Execute este app dentro do WebView Android</p>
                        </>
                      )}
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`${getLogLineColor(log)} py-0.5 border-b border-gray-700/50`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
