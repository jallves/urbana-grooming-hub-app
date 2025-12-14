import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { getLogsAndroid, limparLogsAndroid, setModoDebug } from '@/lib/tef/tefAndroidBridge';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const TotemStatus: React.FC = () => {
  const {
    isAndroidAvailable,
    isPinpadConnected,
    androidVersion,
    pinpadStatus,
    verificarConexao
  } = useTEFAndroid();

  const [debugMode, setDebugMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleToggleDebug = (enabled: boolean) => {
    setDebugMode(enabled);
    setModoDebug(enabled);
    toast.success(enabled ? 'Modo debug ativado' : 'Modo debug desativado');
  };

  const handleRefreshLogs = () => {
    const newLogs = getLogsAndroid();
    setLogs(newLogs);
    toast.success(`${newLogs.length} logs carregados`);
  };

  const handleClearLogs = () => {
    limparLogsAndroid();
    setLogs([]);
    toast.success('Logs limpos');
  };

  const handleCopyLogs = () => {
    const logsText = logs.join('\n');
    navigator.clipboard.writeText(logsText);
    toast.success('Logs copiados');
  };

  const handleDownloadLogs = () => {
    const logsText = logs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totem-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs baixados');
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
                Monitoramento e logs do sistema Totem integrado
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

      {/* Logs */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bug className="h-5 w-5 text-gray-600" />
                Logs do Totem
              </CardTitle>
              <CardDescription>
                Logs capturados do app Android para debug
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLogs}
                disabled={!isAndroidAvailable}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLogs}
                disabled={logs.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isAndroidAvailable ? (
            <div className="text-center py-8 text-gray-500">
              <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">App Android não detectado</p>
              <p className="text-sm mt-2">
                Os logs só estão disponíveis quando o sistema está rodando no Totem físico.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum log capturado</p>
              <p className="text-sm mt-2">
                Ative o modo debug e realize operações para capturar logs.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="py-0.5 border-b border-gray-800 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TotemStatus;
