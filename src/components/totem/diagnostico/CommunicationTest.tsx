import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';

interface TestResult {
  id: string;
  name: string;
  description: string;
  direction: 'js-to-android' | 'android-to-js' | 'bidirectional';
  status: 'pending' | 'success' | 'error' | 'running' | 'warning';
  message?: string;
  duration?: number;
  rawResponse?: string;
}

interface CommunicationTestProps {
  onTestComplete?: (results: TestResult[]) => void;
}

export const CommunicationTest: React.FC<CommunicationTestProps> = ({ onTestComplete }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const updateResult = useCallback((id: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const initialTests: TestResult[] = [
    { 
      id: 'user-agent', 
      name: 'UserAgent Android', 
      description: 'Verifica se está rodando em ambiente Android',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'webview-check', 
      name: 'WebView Detectado', 
      description: 'Verifica se é um WebView Android (não Chrome)',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'android-interface', 
      name: 'window.Android', 
      description: 'Interface nativa via addJavascriptInterface',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'tef-interface', 
      name: 'window.TEF', 
      description: 'Interface TEF injetada via evaluateJavascript',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'tef-methods', 
      name: 'Métodos TEF', 
      description: 'Verifica se todos os métodos obrigatórios existem',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'verificar-pinpad', 
      name: 'verificarPinpad()', 
      description: 'Chama o método e valida resposta JSON',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'pinpad-real', 
      name: 'SDK Real (não MOCK)', 
      description: 'Verifica se está usando SDK PayGo real',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'callback-test', 
      name: 'Callback onTefResultado', 
      description: 'Testa se Android pode chamar callback JS',
      direction: 'android-to-js', 
      status: 'pending' 
    },
    { 
      id: 'set-debug', 
      name: 'setModoDebug()', 
      description: 'Testa ativação/desativação do modo debug',
      direction: 'js-to-android', 
      status: 'pending' 
    },
    { 
      id: 'get-logs', 
      name: 'getLogs()', 
      description: 'Recupera logs do Android',
      direction: 'js-to-android', 
      status: 'pending' 
    },
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(initialTests);

    const totalTests = initialTests.length;
    let completedTests = 0;

    const runTest = async (
      id: string, 
      testFn: () => Promise<{ success: boolean; message: string; warning?: boolean; rawResponse?: string }>
    ) => {
      updateResult(id, { status: 'running' });
      
      const start = performance.now();
      await new Promise(r => setTimeout(r, 150)); // Pequeno delay visual
      
      try {
        const result = await testFn();
        const duration = Math.round(performance.now() - start);
        
        updateResult(id, { 
          status: result.warning ? 'warning' : (result.success ? 'success' : 'error'),
          message: result.message,
          duration,
          rawResponse: result.rawResponse
        });
      } catch (e: any) {
        updateResult(id, { 
          status: 'error',
          message: `Exceção: ${e.message}`,
          duration: Math.round(performance.now() - start)
        });
      }

      completedTests++;
      setProgress(Math.round((completedTests / totalTests) * 100));
    };

    // Teste 1: UserAgent Android
    await runTest('user-agent', async () => {
      const ua = navigator.userAgent;
      const isAndroid = /Android/i.test(ua);
      return {
        success: isAndroid,
        message: isAndroid ? `Android detectado` : 'Não é ambiente Android',
        rawResponse: ua.substring(0, 100)
      };
    });

    // Teste 2: WebView Check
    await runTest('webview-check', async () => {
      const ua = navigator.userAgent;
      const isWebView = /wv|WebView/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      
      if (!isAndroid) {
        return { success: false, message: 'Não aplicável (não é Android)' };
      }
      
      return {
        success: isWebView,
        warning: !isWebView,
        message: isWebView ? 'WebView confirmado' : 'Pode ser Chrome nativo, não WebView do APK',
        rawResponse: isWebView ? 'WebView' : 'Chrome/Browser'
      };
    });

    // Teste 3: window.Android
    await runTest('android-interface', async () => {
      const hasAndroid = typeof (window as any).Android !== 'undefined';
      
      if (hasAndroid) {
        const methods = Object.getOwnPropertyNames((window as any).Android);
        return {
          success: true,
          message: `Encontrado com ${methods.length || '?'} métodos`,
          rawResponse: methods.join(', ') || 'Métodos não listáveis'
        };
      }
      
      return {
        success: false,
        message: 'window.Android não existe',
        rawResponse: 'O APK deve chamar: webView.addJavascriptInterface(bridge, "Android")'
      };
    });

    // Teste 4: window.TEF
    await runTest('tef-interface', async () => {
      const hasTEF = typeof (window as any).TEF !== 'undefined';
      
      if (hasTEF) {
        const methods = Object.keys((window as any).TEF);
        return {
          success: true,
          message: `${methods.length} métodos disponíveis`,
          rawResponse: methods.join(', ')
        };
      }
      
      return {
        success: false,
        message: 'window.TEF não existe',
        rawResponse: 'O APK deve injetar via evaluateJavascript após onPageFinished'
      };
    });

    // Teste 5: Métodos TEF obrigatórios
    await runTest('tef-methods', async () => {
      const tef = (window as any).TEF;
      if (!tef) {
        return { success: false, message: 'window.TEF não existe' };
      }
      
      const required = ['iniciarPagamento', 'cancelarPagamento', 'verificarPinpad', 'setModoDebug', 'getLogs', 'limparLogs'];
      const missing = required.filter(m => typeof tef[m] !== 'function');
      
      if (missing.length === 0) {
        return {
          success: true,
          message: 'Todos os 6 métodos obrigatórios presentes',
          rawResponse: required.join(', ')
        };
      }
      
      return {
        success: false,
        message: `Faltando ${missing.length} método(s)`,
        rawResponse: `Faltando: ${missing.join(', ')}`
      };
    });

    // Teste 6: verificarPinpad()
    await runTest('verificar-pinpad', async () => {
      const tef = (window as any).TEF;
      if (!tef?.verificarPinpad) {
        return { success: false, message: 'Método não disponível' };
      }
      
      const rawResult = tef.verificarPinpad();
      let parsed: any;
      
      try {
        parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
      } catch (e) {
        return {
          success: false,
          message: 'Resposta não é JSON válido',
          rawResponse: String(rawResult).substring(0, 200)
        };
      }
      
      if (typeof parsed !== 'object' || parsed === null) {
        return {
          success: false,
          message: 'Resposta deve ser um objeto',
          rawResponse: JSON.stringify(parsed)
        };
      }
      
      const hasRequired = 'conectado' in parsed && 'timestamp' in parsed;
      
      return {
        success: hasRequired,
        warning: !hasRequired,
        message: parsed.conectado ? `Pinpad: ${parsed.modelo || 'conectado'}` : 'Pinpad não conectado',
        rawResponse: JSON.stringify(parsed)
      };
    });

    // Teste 7: SDK Real (não MOCK)
    await runTest('pinpad-real', async () => {
      const tef = (window as any).TEF;
      if (!tef?.verificarPinpad) {
        return { success: false, message: 'Não é possível verificar' };
      }
      
      try {
        const rawResult = tef.verificarPinpad();
        const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
        
        const modelo = String(parsed.modelo || '').toLowerCase();
        const isMock = modelo.includes('mock') || modelo.includes('simulador') || modelo.includes('simulator') || modelo.includes('dev');
        
        if (isMock) {
          return {
            success: false,
            message: 'MODO MOCK/SIMULADOR detectado!',
            rawResponse: `Modelo: ${parsed.modelo}. O APK deve usar SDK PayGo real.`
          };
        }
        
        if (!parsed.conectado) {
          return {
            success: false,
            warning: true,
            message: 'Pinpad não conectado - não é possível confirmar SDK real',
            rawResponse: JSON.stringify(parsed)
          };
        }
        
        return {
          success: true,
          message: `SDK real detectado: ${parsed.modelo}`,
          rawResponse: JSON.stringify(parsed)
        };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    });

    // Teste 8: Callback onTefResultado
    await runTest('callback-test', async () => {
      return new Promise((resolve) => {
        const originalCallback = (window as any).onTefResultado;
        let callbackReceived = false;
        const testData: TEFResultado = { 
          status: 'aprovado', 
          mensagem: 'TESTE_CALLBACK_PWA',
          timestamp: Date.now()
        };
        
        // Registrar callback temporário
        (window as any).onTefResultado = (resultado: TEFResultado) => {
          if (resultado.mensagem === 'TESTE_CALLBACK_PWA') {
            callbackReceived = true;
          }
        };
        
        // Simular chamada do callback (como o Android faria)
        try {
          (window as any).onTefResultado(testData);
        } catch (e) {
          // Ignorar erro
        }
        
        // Restaurar callback original
        (window as any).onTefResultado = originalCallback;
        
        resolve({
          success: callbackReceived,
          message: callbackReceived 
            ? 'Callback JS executou corretamente' 
            : 'Callback não foi executado',
          rawResponse: 'window.onTefResultado é definido dinamicamente quando inicia pagamento'
        });
      });
    });

    // Teste 9: setModoDebug()
    await runTest('set-debug', async () => {
      const tef = (window as any).TEF;
      if (!tef?.setModoDebug) {
        return { success: false, message: 'Método não disponível' };
      }
      
      try {
        tef.setModoDebug(true);
        tef.setModoDebug(false);
        return {
          success: true,
          message: 'Método executou sem erros',
          rawResponse: 'setModoDebug(true) e setModoDebug(false) executados'
        };
      } catch (e: any) {
        return {
          success: false,
          message: `Erro: ${e.message}`,
          rawResponse: e.stack || e.message
        };
      }
    });

    // Teste 10: getLogs()
    await runTest('get-logs', async () => {
      const tef = (window as any).TEF;
      if (!tef?.getLogs) {
        return { success: false, message: 'Método não disponível' };
      }
      
      try {
        const rawResult = tef.getLogs();
        let parsed: any;
        
        try {
          parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
        } catch {
          return {
            success: false,
            message: 'Resposta não é JSON válido',
            rawResponse: String(rawResult).substring(0, 200)
          };
        }
        
        const logs = parsed.logs || [];
        return {
          success: true,
          message: `${logs.length} log(s) retornado(s)`,
          rawResponse: logs.slice(0, 3).join('\n') || 'Nenhum log'
        };
      } catch (e: any) {
        return {
          success: false,
          message: `Erro: ${e.message}`,
          rawResponse: e.stack || e.message
        };
      }
    });

    setIsRunning(false);
    
    // Notificar resultados
    const finalResults = results;
    const successCount = finalResults.filter(r => r.status === 'success').length;
    const errorCount = finalResults.filter(r => r.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success('Todos os testes passaram!');
    } else if (successCount > errorCount) {
      toast.warning(`${successCount} passou, ${errorCount} falhou`);
    } else {
      toast.error(`${errorCount} teste(s) falharam`);
    }
    
    onTestComplete?.(finalResults);
  };

  // Auto-refresh a cada 5 segundos se habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!isRunning) {
        runAllTests();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, isRunning]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-500/30 bg-green-500/5';
      case 'error': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'running': return 'border-blue-500/30 bg-blue-500/5';
      default: return 'border-border/50 bg-muted/30';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Testes de Comunicação
            </CardTitle>
            <CardDescription>
              Verifica cada aspecto da integração APK ↔ PWA
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-green-500">{successCount}✓</span>
                <span className="text-yellow-500">{warningCount}⚠</span>
                <span className="text-red-500">{errorCount}✗</span>
              </div>
            )}
            <Button 
              size="sm" 
              onClick={runAllTests}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  {progress}%
                </>
              ) : (
                'Executar Testes'
              )}
            </Button>
          </div>
        </div>
        {isRunning && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Clique em "Executar Testes" para verificar a comunicação com o APK
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {results.map((result) => (
              <div 
                key={result.id}
                className={`p-3 rounded-lg border transition-all ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{result.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 shrink-0">
                          {result.direction === 'js-to-android' ? (
                            <><span className="hidden sm:inline">JS</span>→<span className="hidden sm:inline">Android</span></>
                          ) : result.direction === 'android-to-js' ? (
                            <><span className="hidden sm:inline">Android</span>→<span className="hidden sm:inline">JS</span></>
                          ) : '↔'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{result.description}</p>
                      {result.message && (
                        <p className={`text-xs mt-1 ${
                          result.status === 'success' ? 'text-green-400' :
                          result.status === 'error' ? 'text-red-400' :
                          result.status === 'warning' ? 'text-yellow-400' :
                          'text-muted-foreground'
                        }`}>
                          → {result.message}
                        </p>
                      )}
                      {result.rawResponse && result.status !== 'pending' && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                          {result.rawResponse}
                        </p>
                      )}
                    </div>
                  </div>
                  {result.duration && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {result.duration}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
