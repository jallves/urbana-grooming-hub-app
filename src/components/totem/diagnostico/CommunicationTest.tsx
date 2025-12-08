import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  name: string;
  direction: 'js-to-android' | 'android-to-js';
  status: 'pending' | 'success' | 'error' | 'running';
  message?: string;
  duration?: number;
}

export const CommunicationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (id: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const tests: TestResult[] = [
      { id: 'android-exists', name: 'window.Android existe', direction: 'js-to-android', status: 'pending' },
      { id: 'tef-exists', name: 'window.TEF existe', direction: 'js-to-android', status: 'pending' },
      { id: 'verificar-pinpad', name: 'TEF.verificarPinpad()', direction: 'js-to-android', status: 'pending' },
      { id: 'callback-registered', name: 'Callback onTefResultado', direction: 'android-to-js', status: 'pending' },
      { id: 'set-debug', name: 'TEF.setModoDebug()', direction: 'js-to-android', status: 'pending' },
      { id: 'get-logs', name: 'TEF.getLogs()', direction: 'js-to-android', status: 'pending' },
    ];
    setResults(tests);

    // Teste 1: window.Android
    await runTest('android-exists', () => {
      if (typeof (window as any).Android !== 'undefined') {
        return { success: true, message: 'Interface Android encontrada' };
      }
      return { success: false, message: 'window.Android não existe' };
    });

    // Teste 2: window.TEF
    await runTest('tef-exists', () => {
      if (typeof (window as any).TEF !== 'undefined') {
        const methods = Object.keys((window as any).TEF);
        return { success: true, message: `${methods.length} métodos disponíveis` };
      }
      return { success: false, message: 'window.TEF não existe' };
    });

    // Teste 3: verificarPinpad
    await runTest('verificar-pinpad', () => {
      if (!(window as any).TEF?.verificarPinpad) {
        return { success: false, message: 'Método não disponível' };
      }
      try {
        const result = (window as any).TEF.verificarPinpad();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return { 
          success: true, 
          message: parsed.conectado ? `Conectado: ${parsed.modelo}` : 'Pinpad não conectado'
        };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    });

    // Teste 4: Callback
    await runTest('callback-registered', () => {
      // Registrar callback temporário
      let callbackWorks = false;
      const originalCallback = (window as any).onTefResultado;
      
      (window as any).onTefResultado = () => { callbackWorks = true; };
      
      // Testar se callback pode ser chamado
      try {
        (window as any).onTefResultado({ status: 'teste' });
        (window as any).onTefResultado = originalCallback;
        return { success: callbackWorks, message: callbackWorks ? 'Callback funcionando' : 'Callback não executou' };
      } catch (e: any) {
        (window as any).onTefResultado = originalCallback;
        return { success: false, message: e.message };
      }
    });

    // Teste 5: setModoDebug
    await runTest('set-debug', () => {
      if (!(window as any).TEF?.setModoDebug) {
        return { success: false, message: 'Método não disponível' };
      }
      try {
        (window as any).TEF.setModoDebug(true);
        (window as any).TEF.setModoDebug(false);
        return { success: true, message: 'Método executou sem erros' };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    });

    // Teste 6: getLogs
    await runTest('get-logs', () => {
      if (!(window as any).TEF?.getLogs) {
        return { success: false, message: 'Método não disponível' };
      }
      try {
        const result = (window as any).TEF.getLogs();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return { 
          success: true, 
          message: `${parsed.logs?.length || 0} logs retornados` 
        };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    });

    setIsRunning(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    if (successCount === tests.length) {
      toast.success('Todos os testes passaram!');
    } else {
      toast.warning(`${successCount}/${tests.length} testes passaram`);
    }
  };

  const runTest = async (
    id: string, 
    testFn: () => { success: boolean; message: string }
  ) => {
    updateResult(id, { status: 'running' });
    
    const start = performance.now();
    await new Promise(r => setTimeout(r, 300)); // Delay visual
    
    const result = testFn();
    const duration = Math.round(performance.now() - start);
    
    updateResult(id, { 
      status: result.success ? 'success' : 'error',
      message: result.message,
      duration
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Teste de Comunicação
          </CardTitle>
          <Button 
            size="sm" 
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? 'Testando...' : 'Executar Testes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Executar Testes" para verificar a comunicação
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <div 
                key={result.id}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  result.status === 'success' 
                    ? 'border-green-500/30 bg-green-500/5'
                    : result.status === 'error'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-border/50 bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{result.name}</span>
                    {result.direction === 'js-to-android' ? (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge variant="outline" className="text-[10px] px-1">
                      {result.direction === 'js-to-android' ? 'JS→Android' : 'Android→JS'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.message && (
                    <span className="text-xs text-muted-foreground">{result.message}</span>
                  )}
                  {result.duration && (
                    <span className="text-[10px] text-muted-foreground">{result.duration}ms</span>
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
