import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  CreditCard, 
  Smartphone, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Trash2,
  Download,
  Copy,
  Loader2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import {
  isAndroidTEFAvailable,
  verificarPinpad,
  setModoDebug,
  getLogsAndroid,
  limparLogsAndroid,
  TEFPinpadStatus
} from '@/lib/tef/tefAndroidBridge';

interface TotemTEFDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TotemTEFDiagnostics: React.FC<TotemTEFDiagnosticsProps> = ({
  isOpen,
  onClose
}) => {
  const [debugMode, setDebugMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [manualPinpadStatus, setManualPinpadStatus] = useState<TEFPinpadStatus | null>(null);

  const {
    isAndroidAvailable,
    isPinpadConnected,
    pinpadStatus,
    androidVersion,
    verificarConexao,
    iniciarPagamento
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      setIsTestingPayment(false);
      toast.success('Pagamento de teste aprovado!', {
        description: `NSU: ${resultado.nsu} | Auth: ${resultado.autorizacao}`
      });
    },
    onError: (erro) => {
      setIsTestingPayment(false);
      toast.error('Erro no pagamento de teste', { description: erro });
    },
    onCancelled: () => {
      setIsTestingPayment(false);
      toast.info('Pagamento de teste cancelado');
    }
  });

  // Verificar status ao abrir
  useEffect(() => {
    if (isOpen) {
      handleRefresh();
    }
  }, [isOpen]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Verificar conexão
    const status = verificarConexao();
    setManualPinpadStatus(status);
    
    // Buscar logs
    if (isAndroidTEFAvailable()) {
      const androidLogs = getLogsAndroid();
      setLogs(androidLogs);
    }
    
    setLastCheck(new Date());
    setIsRefreshing(false);
    toast.success('Status atualizado');
  }, [verificarConexao]);

  const handleToggleDebug = useCallback((enabled: boolean) => {
    setDebugMode(enabled);
    const success = setModoDebug(enabled);
    if (success) {
      toast.success(`Modo debug ${enabled ? 'ativado' : 'desativado'}`);
    } else {
      toast.error('Falha ao alterar modo debug');
    }
  }, []);

  const handleClearLogs = useCallback(() => {
    const success = limparLogsAndroid();
    if (success) {
      setLogs([]);
      toast.success('Logs limpos');
    } else {
      toast.error('Falha ao limpar logs');
    }
  }, []);

  const handleCopyLogs = useCallback(() => {
    const logsText = logs.join('\n');
    navigator.clipboard.writeText(logsText);
    toast.success('Logs copiados para a área de transferência');
  }, [logs]);

  const handleDownloadLogs = useCallback(() => {
    const logsText = logs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tef-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs baixados');
  }, [logs]);

  const handleTestPayment = useCallback(async () => {
    if (!isAndroidAvailable || !isPinpadConnected) {
      toast.error('Pinpad não está conectado');
      return;
    }

    setIsTestingPayment(true);
    
    // Pagamento de teste de R$ 1,00
    const success = await iniciarPagamento({
      ordemId: `TEST-${Date.now()}`,
      valor: 1.00,
      tipo: 'credit',
      parcelas: 1
    });

    if (!success) {
      setIsTestingPayment(false);
    }
  }, [isAndroidAvailable, isPinpadConnected, iniciarPagamento]);

  const StatusIcon = ({ connected }: { connected: boolean }) => (
    connected ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-urbana-black border-urbana-gold/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-urbana-gold">
            <Terminal className="w-5 h-5" />
            Diagnóstico TEF PayGo
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Status Geral */}
            <Card className="bg-urbana-black-soft border-urbana-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-urbana-gold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Status da Integração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Android App */}
                <div className="flex items-center justify-between p-3 bg-urbana-black/50 rounded-lg border border-urbana-gold/10">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm font-medium text-urbana-light">Aplicativo Android</p>
                      <p className="text-xs text-urbana-light/60">
                        {isAndroidAvailable ? `Versão: ${androidVersion || 'Detectado'}` : 'WebView TEF não detectado'}
                      </p>
                    </div>
                  </div>
                  <StatusIcon connected={isAndroidAvailable} />
                </div>

                {/* SDK PayGo */}
                <div className="flex items-center justify-between p-3 bg-urbana-black/50 rounded-lg border border-urbana-gold/10">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm font-medium text-urbana-light">SDK PayGo TEF</p>
                      <p className="text-xs text-urbana-light/60">
                        {isAndroidAvailable ? 'Interface TEF disponível' : 'Aguardando conexão'}
                      </p>
                    </div>
                  </div>
                  <StatusIcon connected={isAndroidAvailable} />
                </div>

                {/* Pinpad */}
                <div className="flex items-center justify-between p-3 bg-urbana-black/50 rounded-lg border border-urbana-gold/10">
                  <div className="flex items-center gap-3">
                    {isPinpadConnected ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-urbana-light">Pinpad PPC930</p>
                      <p className="text-xs text-urbana-light/60">
                        {isPinpadConnected 
                          ? `Modelo: ${pinpadStatus?.modelo || manualPinpadStatus?.modelo || 'Conectado'}`
                          : 'Desconectado ou não detectado'
                        }
                      </p>
                    </div>
                  </div>
                  <StatusIcon connected={isPinpadConnected} />
                </div>

                {/* Última verificação */}
                {lastCheck && (
                  <p className="text-xs text-urbana-light/40 text-center">
                    Última verificação: {lastCheck.toLocaleTimeString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <Card className="bg-urbana-black-soft border-urbana-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-urbana-gold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Ações de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Atualizar Status
                  </Button>

                  <Button
                    onClick={handleTestPayment}
                    disabled={!isAndroidAvailable || !isPinpadConnected || isTestingPayment}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isTestingPayment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Teste R$ 1,00
                  </Button>
                </div>

                {/* Aviso de teste */}
                {(!isAndroidAvailable || !isPinpadConnected) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-200">
                      <p className="font-medium">Integração não detectada</p>
                      <p className="mt-1 text-yellow-200/70">
                        Verifique se o aplicativo Android está instalado corretamente e se o pinpad está conectado via USB.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Mode */}
            <Card className="bg-urbana-black-soft border-urbana-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-urbana-gold flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Modo Debug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-urbana-light">Ativar logs detalhados</p>
                    <p className="text-xs text-urbana-light/60">
                      Captura informações de diagnóstico
                    </p>
                  </div>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={handleToggleDebug}
                    disabled={!isAndroidAvailable}
                  />
                </div>

                <Separator className="bg-urbana-gold/10" />

                {/* Log Controls */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLogs}
                    disabled={logs.length === 0}
                    className="text-urbana-gold/70 hover:text-urbana-gold hover:bg-urbana-gold/10"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadLogs}
                    disabled={logs.length === 0}
                    className="text-urbana-gold/70 hover:text-urbana-gold hover:bg-urbana-gold/10"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLogs}
                    disabled={logs.length === 0}
                    className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                </div>

                {/* Logs */}
                <div className="bg-urbana-black rounded-lg border border-urbana-gold/10 max-h-48 overflow-auto">
                  {logs.length > 0 ? (
                    <div className="p-2 font-mono text-xs text-urbana-light/80 space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="border-b border-urbana-gold/5 pb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-urbana-light/40 text-sm">
                      {isAndroidAvailable 
                        ? 'Nenhum log disponível. Ative o modo debug para capturar logs.'
                        : 'Logs não disponíveis - Android TEF não detectado.'
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card className="bg-urbana-black-soft border-urbana-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-urbana-gold">
                  Informações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-urbana-black/50 rounded">
                    <p className="text-urbana-light/50">window.TEF</p>
                    <p className="text-urbana-light font-mono">
                      {isAndroidAvailable ? 'disponível' : 'null'}
                    </p>
                  </div>
                  <div className="p-2 bg-urbana-black/50 rounded">
                    <p className="text-urbana-light/50">Pinpad Status</p>
                    <p className="text-urbana-light font-mono">
                      {isPinpadConnected ? 'conectado' : 'desconectado'}
                    </p>
                  </div>
                  <div className="p-2 bg-urbana-black/50 rounded">
                    <p className="text-urbana-light/50">Modelo Pinpad</p>
                    <p className="text-urbana-light font-mono">
                      {pinpadStatus?.modelo || 'N/A'}
                    </p>
                  </div>
                  <div className="p-2 bg-urbana-black/50 rounded">
                    <p className="text-urbana-light/50">App Version</p>
                    <p className="text-urbana-light font-mono">
                      {androidVersion || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-urbana-gold/10">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TotemTEFDiagnostics;
