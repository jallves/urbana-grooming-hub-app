import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause,
  Wifi,
  WifiOff,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { TEFResultado, TEFPinpadStatus } from '@/lib/tef/tefAndroidBridge';

interface TEFSimulatorProps {
  onSimulatorStateChange?: (active: boolean) => void;
}

export const TEFSimulator: React.FC<TEFSimulatorProps> = ({ onSimulatorStateChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [simulatePinpad, setSimulatePinpad] = useState(true);
  const [autoApprove, setAutoApprove] = useState(true);
  const [responseDelay, setResponseDelay] = useState(2000);

  useEffect(() => {
    if (isActive) {
      activateSimulator();
    } else {
      deactivateSimulator();
    }
    onSimulatorStateChange?.(isActive);
  }, [isActive, simulatePinpad, autoApprove, responseDelay]);

  const activateSimulator = () => {
    // Criar interface TEF simulada
    (window as any).TEF = {
      iniciarPagamento: (jsonParams: string) => {
        console.log('[TEFSimulator] Pagamento iniciado:', jsonParams);
        const params = JSON.parse(jsonParams);
        
        setTimeout(() => {
          const resultado: TEFResultado = autoApprove ? {
            status: 'aprovado',
            valor: params.valorCentavos,
            bandeira: 'VISA',
            nsu: `SIM${Date.now()}`,
            autorizacao: `AUTH${Math.floor(Math.random() * 999999)}`,
            ordemId: params.ordemId,
            timestamp: Date.now(),
            mensagem: '[SIMULADOR] Pagamento aprovado'
          } : {
            status: 'negado',
            codigoResposta: '51',
            mensagem: '[SIMULADOR] Saldo insuficiente',
            ordemId: params.ordemId,
            timestamp: Date.now()
          };
          
          if ((window as any).onTefResultado) {
            (window as any).onTefResultado(resultado);
          }
        }, responseDelay);
      },
      
      cancelarPagamento: () => {
        console.log('[TEFSimulator] Pagamento cancelado');
        setTimeout(() => {
          if ((window as any).onTefResultado) {
            (window as any).onTefResultado({
              status: 'cancelado',
              mensagem: '[SIMULADOR] Cancelado pelo usuário',
              timestamp: Date.now()
            });
          }
        }, 500);
      },
      
      verificarPinpad: (): string => {
        const status: TEFPinpadStatus = simulatePinpad ? {
          conectado: true,
          modelo: 'SIMULADOR-DEV (não é SDK real)',
          timestamp: Date.now()
        } : {
          conectado: false,
          modelo: undefined,
          timestamp: Date.now()
        };
        return JSON.stringify(status);
      },
      
      setModoDebug: (enabled: boolean) => {
        console.log('[TEFSimulator] Debug mode:', enabled);
      },
      
      getLogs: (): string => {
        return JSON.stringify({
          logs: [
            '[SIMULADOR] Este é um ambiente de desenvolvimento',
            '[SIMULADOR] Use o APK real para testes de produção'
          ]
        });
      },
      
      limparLogs: () => {
        console.log('[TEFSimulator] Logs limpos');
      }
    };

    // Disparar evento de pronto
    window.dispatchEvent(new CustomEvent('tefAndroidReady', {
      detail: { version: 'SIMULATOR-1.0.0' }
    }));

    if (simulatePinpad) {
      window.dispatchEvent(new CustomEvent('tefPinpadConnected', {
        detail: { modelo: 'SIMULADOR-DEV' }
      }));
    }

    toast.success('Simulador TEF ativado', {
      description: 'Use apenas para desenvolvimento!'
    });
  };

  const deactivateSimulator = () => {
    delete (window as any).TEF;
    toast.info('Simulador TEF desativado');
  };

  const isRealAndroid = /Android/i.test(navigator.userAgent);

  return (
    <Card className={`border-2 ${isActive ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Simulador TEF (Desenvolvimento)
            </CardTitle>
            <CardDescription className="mt-1">
              Simula a interface TEF para testes sem o APK
            </CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-yellow-500' : ''}>
            {isActive ? 'ATIVO' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRealAndroid && (
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-orange-600 dark:text-orange-400">
              Você está em ambiente Android. O simulador deve ser usado apenas no PC.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="simulator-toggle">Ativar Simulador</Label>
            <p className="text-xs text-muted-foreground">
              Cria window.TEF simulado para testes
            </p>
          </div>
          <Switch
            id="simulator-toggle"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isRealAndroid}
          />
        </div>

        {isActive && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pinpad-toggle" className="flex items-center gap-2">
                  {simulatePinpad ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  Simular Pinpad Conectado
                </Label>
              </div>
              <Switch
                id="pinpad-toggle"
                checked={simulatePinpad}
                onCheckedChange={setSimulatePinpad}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="approve-toggle">Auto-aprovar Pagamentos</Label>
                <p className="text-xs text-muted-foreground">
                  {autoApprove ? 'Pagamentos serão aprovados' : 'Pagamentos serão negados'}
                </p>
              </div>
              <Switch
                id="approve-toggle"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ⚠️ O simulador é apenas para desenvolvimento. Para testes reais, 
                use o APK com SDK PayGo integrado.
              </p>
            </div>
          </>
        )}

        <Button
          variant={isActive ? 'destructive' : 'default'}
          className="w-full"
          onClick={() => setIsActive(!isActive)}
          disabled={isRealAndroid}
        >
          {isActive ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Desativar Simulador
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Ativar Simulador
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
