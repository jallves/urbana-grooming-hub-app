import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { getLogsAndroid, limparLogsAndroid, setModoDebug } from '@/lib/tef/tefAndroidBridge';
import {
  Smartphone,
  Usb,
  CheckCircle,
  XCircle,
  FileText,
  Code,
  Bug,
  RefreshCw,
  Trash2,
  Copy,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const TEFAndroidIntegration: React.FC = () => {
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
    toast.success('Logs copiados para a área de transferência');
  };

  const handleDownloadLogs = () => {
    const logsText = logs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tef-android-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs baixados');
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              App Android
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isAndroidAvailable ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-700">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Não detectado</span>
                </>
              )}
            </div>
            {androidVersion && (
              <p className="text-xs text-gray-500 mt-1">Versão: {androidVersion}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Usb className="h-4 w-4" />
              Pinpad PPC930
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isPinpadConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-700">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Desconectado</span>
                </>
              )}
            </div>
            {pinpadStatus?.modelo && (
              <p className="text-xs text-gray-500 mt-1">Modelo: {pinpadStatus.modelo}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => verificarConexao()}
              disabled={!isAndroidAvailable}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Verificar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Modo Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="debug-mode" className="text-sm">
                {debugMode ? 'Ativado' : 'Desativado'}
              </Label>
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={handleToggleDebug}
                disabled={!isAndroidAvailable}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Captura logs detalhados para homologação PayGo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="bg-white border border-gray-200 grid grid-cols-3">
          <TabsTrigger value="docs" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Code className="h-4 w-4 mr-2" />
            Interface JS
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Bug className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Documentação */}
        <TabsContent value="docs" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Integração Totem Android + TEF PayGo</CardTitle>
              <CardDescription>
                Guia para desenvolvimento do app Android nativo com WebView e SDK PayGo TEF Local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Arquitetura */}
              <div>
                <h4 className="font-semibold text-black mb-2">Arquitetura</h4>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{`┌─────────────────────────────────────────────┐
│          Android App (Kotlin/Java)          │
├─────────────────────────────────────────────┤
│  WebView (PWA)  ◄──► TEF Bridge ◄──► Pinpad │
│                      (JavaScript)   (USB)   │
├─────────────────────────────────────────────┤
│            PayGo TEF Local SDK              │
└─────────────────────────────────────────────┘`}</pre>
                </div>
              </div>

              {/* Requisitos */}
              <div>
                <h4 className="font-semibold text-black mb-2">Requisitos</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Hardware</Badge>
                    Samsung Galaxy Tab A SM-T510 + Gertec PPC930 USB
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Software</Badge>
                    Android SDK 21+, SDK PayGo TEF Local
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Pinpad</Badge>
                    Vendor ID: 1753, Product ID: 0xC902 (CDC/ACM)
                  </li>
                </ul>
              </div>

              {/* Bridge JS */}
              <div>
                <h4 className="font-semibold text-black mb-2">Interface JavaScript (Bridge)</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  <pre>{`// Métodos expostos pelo Android:
TEF.iniciarPagamento(jsonParams: string)  // Inicia pagamento
TEF.cancelarPagamento()                    // Cancela pagamento atual
TEF.verificarPinpad()                      // Status do pinpad
TEF.setModoDebug(boolean)                  // Ativa/desativa debug

// Parâmetros do pagamento (JSON string):
{
  "ordemId": "ORD-12345",
  "valorCentavos": 15000,        // R$ 150,00
  "metodo": "credito",           // debito | credito | credito_parcelado | voucher
  "parcelas": 1
}

// Callback no PWA (definido pelo frontend):
window.onTefResultado = function(resultado) {
  // resultado.status: aprovado | negado | cancelado | erro
  // resultado.nsu, resultado.autorizacao, etc.
}`}</pre>
                </div>
              </div>

              {/* Fluxo */}
              <div>
                <h4 className="font-semibold text-black mb-2">Fluxo de Pagamento</h4>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>PWA chama <code className="bg-gray-100 px-1 rounded">TEF.iniciarPagamento(params)</code></li>
                  <li>App Android parseia JSON e chama SDK PayGo</li>
                  <li>Pinpad processa cartão/transação</li>
                  <li>SDK retorna resultado via callback</li>
                  <li>App Android chama <code className="bg-gray-100 px-1 rounded">window.onTefResultado(resultado)</code></li>
                  <li>PWA atualiza UI e chama backend</li>
                </ol>
              </div>

              {/* Documentação completa */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('/docs/TOTEM_ANDROID_TEF.md', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Documentação Completa (Markdown)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Interface JS */}
        <TabsContent value="code" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Interface JavaScript para o PWA</CardTitle>
              <CardDescription>
                Código implementado no PWA para comunicação com o app Android
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs">
                  <pre>{`// Hook useTEFAndroid - Uso no componente React:

import { useTEFAndroid } from '@/hooks/useTEFAndroid';

function TotemPayment() {
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing,
    iniciarPagamento,
    cancelarPagamento
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      console.log('Aprovado!', resultado.nsu, resultado.autorizacao);
      // Chamar backend para registrar venda
    },
    onError: (erro) => {
      console.error('Erro:', erro);
    },
    onCancelled: () => {
      console.log('Pagamento cancelado');
    }
  });

  const handlePagar = async () => {
    if (!isAndroidAvailable || !isPinpadConnected) {
      // Fallback: usar pagamento web (mock/TESS)
      return;
    }

    const sucesso = await iniciarPagamento({
      ordemId: 'ORD-' + Date.now(),
      valor: 150.00,  // em reais
      tipo: 'credit',
      parcelas: 1
    });

    if (sucesso) {
      // Pagamento aprovado - onSuccess já foi chamado
    }
  };

  return (
    <div>
      {isAndroidAvailable ? (
        <p>✅ TEF Android disponível</p>
      ) : (
        <p>⚠️ Usando modo web</p>
      )}
      
      <button 
        onClick={handlePagar} 
        disabled={isProcessing}
      >
        {isProcessing ? 'Processando...' : 'Pagar'}
      </button>
      
      {isProcessing && (
        <button onClick={cancelarPagamento}>
          Cancelar
        </button>
      )}
    </div>
  );
}`}</pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Logs de Debug</CardTitle>
                  <CardDescription>
                    Logs capturados do app Android para homologação PayGo
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
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>App Android não detectado</p>
                  <p className="text-sm mt-2">
                    Os logs só estão disponíveis quando o PWA está rodando dentro do WebView do app Android.
                  </p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log capturado</p>
                  <p className="text-sm mt-2">
                    Ative o modo debug e realize transações para capturar logs.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TEFAndroidIntegration;
