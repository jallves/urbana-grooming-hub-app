import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { toast } from 'sonner';

export const PushDebugPanel = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const [swState, setSwState] = useState<string>('checking...');
  const [clientToken, setClientToken] = useState<string | null>(null);

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setSwState(registration.active?.state || 'installing');
        } else {
          setSwState('not registered');
        }
      } catch (error) {
        setSwState('error');
      }
    } else {
      setSwState('not supported');
    }
  };

  useEffect(() => {
    checkServiceWorker();
    setClientToken(localStorage.getItem('painel_cliente_token'));
  }, []);

  const handleTestSubscribe = async () => {
    console.log('%c🧪 TESTE MANUAL DE SUBSCRIÇÃO', 'background: purple; color: white; font-size: 16px; padding: 8px;');
    toast.loading('Testando ativação...', { id: 'test-subscribe' });
    
    try {
      const result = await subscribe();
      if (result) {
        toast.success('✅ Teste bem-sucedido!', { id: 'test-subscribe' });
      } else {
        toast.error('❌ Teste falhou - veja o console', { id: 'test-subscribe' });
      }
      checkServiceWorker();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: 'test-subscribe' });
    }
  };

  const getStatusColor = (status: boolean | string) => {
    if (status === true || status === 'activated' || status === 'granted') return 'bg-green-500';
    if (status === false || status === 'denied') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <Card className="border-2 border-dashed border-gray-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">🔧 Debug: Push Notifications</CardTitle>
          <Button size="sm" variant="ghost" onClick={checkServiceWorker}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span>Navegador suporta:</span>
          <Badge variant={isSupported ? "default" : "destructive"}>
            {isSupported ? 'SIM ✅' : 'NÃO ❌'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Service Worker:</span>
          <Badge className={getStatusColor(swState === 'activated')}>
            {swState}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Permissão:</span>
          <Badge className={getStatusColor(permission)}>
            {permission}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Inscrito:</span>
          <Badge className={getStatusColor(isSubscribed)}>
            {isSubscribed ? 'SIM ✅' : 'NÃO ❌'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Loading:</span>
          <Badge variant={isLoading ? "secondary" : "outline"}>
            {isLoading ? 'SIM' : 'NÃO'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Auth Token:</span>
          <Badge variant={clientToken ? "default" : "destructive"}>
            {clientToken ? 'OK ✅' : 'MISSING ❌'}
          </Badge>
        </div>

        <div className="pt-2 border-t border-gray-700 text-[10px] text-gray-500">
          💡 Abra o Console (F12) para ver logs detalhados
        </div>

        {!isSubscribed && isSupported && (
          <Button 
            onClick={handleTestSubscribe}
            disabled={isLoading}
            size="sm"
            className="w-full mt-2"
          >
            <Bell className="h-3 w-3 mr-2" />
            {isLoading ? 'Testando...' : '🧪 Testar Ativação'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
