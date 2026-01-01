import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { getLogsAndroid, limparLogsAndroid, setModoDebug } from '@/lib/tef/tefAndroidBridge';
import {
  getAllLogs,
  getAvailableDates,
  getLogsByDate,
  clearAllLogs,
  clearLogsByDate,
  getStorageStats,
  formatDateForDisplay,
  StoredTransactionLog,
  StoredAndroidLog
} from '@/lib/tef/tefLogStorage';
import {
  Smartphone,
  Usb,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Bug,
  RefreshCw,
  Trash2,
  Copy,
  Download,
  Cpu,
  HardDrive,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  Info,
  ChevronDown,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TotemStatus: React.FC = () => {
  const {
    isAndroidAvailable,
    isPinpadConnected,
    androidVersion,
    pinpadStatus,
    verificarConexao
  } = useTEFAndroid();

  const [debugMode, setDebugMode] = useState(false);
  const [androidLogs, setAndroidLogs] = useState<string[]>([]);
  
  // Logs persistidos
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [transactionLogs, setTransactionLogs] = useState<StoredTransactionLog[]>([]);
  const [storedAndroidLogs, setStoredAndroidLogs] = useState<StoredAndroidLog[]>([]);
  const [storageStats, setStorageStats] = useState<ReturnType<typeof getStorageStats> | null>(null);

  // Carregar logs persistidos ao montar
  useEffect(() => {
    loadPersistedLogs();
  }, []);

  const loadPersistedLogs = () => {
    const dates = getAvailableDates();
    setAvailableDates(dates);
    
    const stats = getStorageStats();
    setStorageStats(stats);
    
    // Selecionar a data mais recente
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
      loadLogsForDate(dates[0]);
    } else if (selectedDate) {
      loadLogsForDate(selectedDate);
    }
  };

  const loadLogsForDate = (date: string) => {
    const logs = getLogsByDate(date);
    setTransactionLogs(logs.transactionLogs);
    setStoredAndroidLogs(logs.androidLogs);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadLogsForDate(date);
  };

  const handleToggleDebug = (enabled: boolean) => {
    setDebugMode(enabled);
    setModoDebug(enabled);
    toast.success(enabled ? 'Modo debug ativado' : 'Modo debug desativado');
  };

  const handleRefreshAndroidLogs = () => {
    const newLogs = getLogsAndroid();
    setAndroidLogs(newLogs);
    toast.success(`${newLogs.length} logs do Android carregados`);
  };

  const handleClearAndroidLogs = () => {
    limparLogsAndroid();
    setAndroidLogs([]);
    toast.success('Logs do Android limpos');
  };

  const handleRefreshPersistedLogs = () => {
    loadPersistedLogs();
    toast.success('Logs atualizados');
  };

  const handleClearDateLogs = () => {
    if (selectedDate) {
      clearLogsByDate(selectedDate);
      loadPersistedLogs();
      toast.success(`Logs de ${formatDateForDisplay(selectedDate)} limpos`);
    }
  };

  const handleClearAllLogs = () => {
    clearAllLogs();
    setTransactionLogs([]);
    setStoredAndroidLogs([]);
    setAvailableDates([]);
    setSelectedDate('');
    setStorageStats(null);
    toast.success('Todos os logs foram limpos');
  };

  const formatLogsForExport = () => {
    const allLogs = getAllLogs();
    
    let output = '═══════════════════════════════════════════════════════════════\n';
    output += '                    LOGS DO TOTEM TEF\n';
    output += `             Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
    output += '═══════════════════════════════════════════════════════════════\n\n';
    
    // Estatísticas
    output += '📊 ESTATÍSTICAS\n';
    output += '───────────────────────────────────────────────────────────────\n';
    output += `Total de logs de transação: ${allLogs.transactionLogs.length}\n`;
    output += `Total de logs do Android: ${allLogs.androidLogs.length}\n`;
    output += `Última limpeza: ${allLogs.lastCleanup}\n\n`;
    
    // Logs de transação agrupados por data
    output += '📋 LOGS DE TRANSAÇÃO\n';
    output += '───────────────────────────────────────────────────────────────\n\n';
    
    const transactionsByDate = allLogs.transactionLogs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, StoredTransactionLog[]>);
    
    Object.entries(transactionsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, logs]) => {
        output += `\n📅 ${formatDateForDisplay(date)} (${date})\n`;
        output += '─────────────────────────────────\n';
        logs.forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
          const icon = getLogIcon(log.type);
          output += `${time} ${icon} ${log.message}\n`;
          if (log.data) {
            output += `         ${JSON.stringify(log.data, null, 2).split('\n').join('\n         ')}\n`;
          }
        });
      });
    
    // Logs do Android agrupados por data
    output += '\n\n📱 LOGS DO ANDROID\n';
    output += '───────────────────────────────────────────────────────────────\n\n';
    
    const androidByDate = allLogs.androidLogs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, StoredAndroidLog[]>);
    
    Object.entries(androidByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, logs]) => {
        output += `\n📅 ${formatDateForDisplay(date)} (${date})\n`;
        output += '─────────────────────────────────\n';
        logs.forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
          output += `${time} ${log.message}\n`;
        });
      });
    
    output += '\n\n═══════════════════════════════════════════════════════════════\n';
    output += '                    FIM DOS LOGS\n';
    output += '═══════════════════════════════════════════════════════════════\n';
    
    return output;
  };

  const getLogIcon = (type: string): string => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'transaction': return '💳';
      default: return 'ℹ️';
    }
  };

  const handleCopyLogs = () => {
    const logsText = formatLogsForExport();
    navigator.clipboard.writeText(logsText);
    toast.success('Logs copiados para a área de transferência');
  };

  const handleDownloadLogs = () => {
    const logsText = formatLogsForExport();
    const blob = new Blob([logsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totem-logs-completo-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs baixados');
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'transaction': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-amber-400" />;
      case 'transaction': return <FileText className="h-3 w-3 text-blue-400" />;
      default: return <Info className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Smartphone className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-900">Status do Totem Android</CardTitle>
              <CardDescription className="text-green-700">
                Monitoramento, logs e diagnóstico do sistema Totem integrado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* App Android */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-gray-600" />
              </div>
              {isAndroidAvailable ? (
                <Badge className="bg-green-100 text-green-700">Online</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">Offline</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">App Android</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isAndroidAvailable ? `Versão ${androidVersion || 'N/A'}` : 'Não detectado'}
            </p>
          </CardContent>
        </Card>

        {/* Pinpad */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Usb className="h-5 w-5 text-gray-600" />
              </div>
              {isPinpadConnected ? (
                <Badge className="bg-green-100 text-green-700">Conectado</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700">Desconectado</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">Pinpad PPC930</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pinpadStatus?.modelo || 'Gertec USB'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-xs"
              onClick={() => verificarConexao()}
              disabled={!isAndroidAvailable}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Verificar
            </Button>
          </CardContent>
        </Card>

        {/* Conectividade */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Wifi className="h-5 w-5 text-gray-600" />
              </div>
              <Badge className="bg-green-100 text-green-700">Ativo</Badge>
            </div>
            <h3 className="font-semibold text-gray-900">Conexão Internet</h3>
            <p className="text-sm text-gray-500 mt-1">WiFi / 4G</p>
          </CardContent>
        </Card>

        {/* Modo Debug */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Bug className="h-5 w-5 text-gray-600" />
              </div>
              {debugMode ? (
                <Badge className="bg-purple-100 text-purple-700">Ativo</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">Inativo</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">Modo Debug</h3>
            <div className="flex items-center gap-2 mt-3">
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={handleToggleDebug}
                disabled={!isAndroidAvailable}
              />
              <Label htmlFor="debug-mode" className="text-xs text-gray-600">
                {debugMode ? 'Ligado' : 'Desligado'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Logs */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-gray-600" />
                Central de Logs do Totem
              </CardTitle>
              <CardDescription>
                Logs persistidos das transações TEF e do app Android (retenção: 30 dias)
              </CardDescription>
            </div>
            {storageStats && (
              <div className="text-right text-xs text-gray-500">
                <p>{storageStats.totalTransactionLogs} logs de transação</p>
                <p>{storageStats.totalAndroidLogs} logs Android</p>
                <p>{storageStats.daysWithLogs} dias com registros</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="persisted" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="persisted" className="text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Logs Persistidos
              </TabsTrigger>
              <TabsTrigger value="realtime" className="text-sm">
                <Smartphone className="h-4 w-4 mr-2" />
                Android (Tempo Real)
              </TabsTrigger>
            </TabsList>

            {/* Logs Persistidos */}
            <TabsContent value="persisted" className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Select value={selectedDate} onValueChange={handleDateChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione a data" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates.map(date => (
                        <SelectItem key={date} value={date}>
                          {formatDateForDisplay(date)} ({date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefreshPersistedLogs}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLogs}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar Tudo
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Limpar Tudo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar todos os logs?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Todos os logs de transação e do Android serão permanentemente excluídos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllLogs} className="bg-red-600 hover:bg-red-700">
                          Limpar Tudo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Lista de logs da data selecionada */}
              {transactionLogs.length === 0 && storedAndroidLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum log encontrado</p>
                  <p className="text-sm mt-2">
                    {selectedDate 
                      ? `Não há logs registrados para ${formatDateForDisplay(selectedDate)}`
                      : 'Selecione uma data ou realize operações no Totem para gerar logs'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono space-y-1">
                    {/* Logs de transação */}
                    {transactionLogs.length > 0 && (
                      <>
                        <div className="text-blue-400 font-bold mb-2 sticky top-0 bg-gray-900 py-1">
                          ═══ LOGS DE TRANSAÇÃO ({transactionLogs.length}) ═══
                        </div>
                        {transactionLogs.map((log, index) => (
                          <div 
                            key={log.id} 
                            className={`py-1 border-b border-gray-800 last:border-0 ${getLogTypeColor(log.type)}`}
                          >
                            <div className="flex items-start gap-2">
                              {getLogTypeIcon(log.type)}
                              <span className="text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                              </span>
                              <span className={getLogTypeColor(log.type)}>{log.message}</span>
                            </div>
                            {log.data && (
                              <pre className="ml-5 mt-1 text-gray-500 whitespace-pre-wrap">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Logs do Android */}
                    {storedAndroidLogs.length > 0 && (
                      <>
                        <div className="text-green-400 font-bold my-2 sticky top-0 bg-gray-900 py-1">
                          ═══ LOGS DO ANDROID ({storedAndroidLogs.length}) ═══
                        </div>
                        {storedAndroidLogs.map((log, index) => (
                          <div key={index} className="py-0.5 border-b border-gray-800 last:border-0">
                            <span className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                            {' '}
                            <span className="text-gray-300">{log.message}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Logs em tempo real do Android */}
            <TabsContent value="realtime" className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshAndroidLogs}
                  disabled={!isAndroidAvailable}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Buscar Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(androidLogs.join('\n'));
                    toast.success('Logs copiados');
                  }}
                  disabled={androidLogs.length === 0}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAndroidLogs}
                  disabled={androidLogs.length === 0 || !isAndroidAvailable}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              {!isAndroidAvailable ? (
                <div className="text-center py-12 text-gray-500">
                  <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">App Android não detectado</p>
                  <p className="text-sm mt-2">
                    Os logs em tempo real só estão disponíveis quando o sistema está rodando no Totem físico.
                  </p>
                </div>
              ) : androidLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum log capturado</p>
                  <p className="text-sm mt-2">
                    Clique em "Buscar Logs" para carregar os logs do Android.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
                    {androidLogs.map((log, index) => (
                      <div key={index} className="py-0.5 border-b border-gray-800 last:border-0">
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-5 w-5 text-gray-600" />
            Informações do Sistema Homologado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Hardware</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Samsung Galaxy Tab A SM-T510</li>
                <li>• Gertec Pinpad PPC930</li>
                <li>• Conexão USB OTG</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Software</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Android 11+ (API 30)</li>
                <li>• SDK PayGo TEF Local</li>
                <li>• WebView Chrome 90+</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Status Homologação</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• TEF Bridge: <span className="text-green-600">Funcional</span></li>
                <li>• USB Driver: <span className="text-green-600">Configurado</span></li>
                <li>• Simulação: <span className="text-green-600">Testada</span></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TotemStatus;
