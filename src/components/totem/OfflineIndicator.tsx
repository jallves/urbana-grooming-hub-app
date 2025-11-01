import { useServiceWorker } from '@/hooks/use-service-worker';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const { isOnline, queuedRequests, retryQueue } = useServiceWorker();

  if (isOnline && queuedRequests === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Sem conexão com a internet. Operações serão enfileiradas.
          </AlertDescription>
        </Alert>
      )}

      {queuedRequests > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{queuedRequests} operação(ões) pendente(s)</span>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryQueue}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar novamente
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOnline && queuedRequests === 0 && (
        <Alert className="border-green-500 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Conexão restaurada. Todas as operações foram sincronizadas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
