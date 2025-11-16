import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { forceApplicationRefresh, forceServiceWorkerUpdate } from '@/utils/forceRefresh';

const CacheManager: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearCache = async () => {
    setIsClearing(true);
    toast({
      title: "🔄 Limpando Cache...",
      description: "Aguarde enquanto limpamos todo o cache do sistema.",
    });

    try {
      // Limpa todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[CacheManager] Todos os caches removidos:', cacheNames);
      }

      // Desregistra todos os service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[CacheManager] Service Workers desregistrados:', registrations.length);
      }

      // Limpa storage local
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: "✅ Cache Limpo!",
        description: "O sistema será recarregado agora.",
      });

      // Aguarda 1 segundo e recarrega
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('[CacheManager] Erro ao limpar cache:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao limpar cache. Tente novamente.",
        variant: "destructive",
      });
      setIsClearing(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsClearing(true);
    toast({
      title: "🔄 Forçando Atualização...",
      description: "Atualizando service worker e recarregando.",
    });

    try {
      await forceServiceWorkerUpdate();
    } catch (error) {
      console.error('[CacheManager] Erro ao forçar atualização:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao forçar atualização. Tente limpar o cache.",
        variant: "destructive",
      });
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Problemas com versão antiga do sistema?</strong>
          <br />
          Use as opções abaixo para forçar a atualização e limpar o cache do PWA.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Forçar Atualização do Sistema
          </CardTitle>
          <CardDescription>
            Força o service worker a atualizar para a versão mais recente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Quando usar?</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Quando o sistema parece estar em uma versão antiga</li>
              <li>Quando mudanças recentes não aparecem</li>
              <li>Quando imagens ou estilos não carregam corretamente</li>
            </ul>
          </div>

          <Button 
            onClick={handleForceUpdate}
            disabled={isClearing}
            className="w-full"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
            {isClearing ? 'Atualizando...' : 'Forçar Atualização Agora'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Limpar Todo o Cache (Avançado)
          </CardTitle>
          <CardDescription>
            Remove completamente todo o cache e reinicia o sistema do zero
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ Atenção:</strong> Esta ação irá:
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                <li>Remover todos os service workers registrados</li>
                <li>Limpar todo o cache do navegador</li>
                <li>Limpar localStorage e sessionStorage</li>
                <li>Recarregar o sistema completamente</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleClearCache}
            disabled={isClearing}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
            {isClearing ? 'Limpando Cache...' : 'Limpar Todo o Cache'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Dicas de Prevenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-green-800 space-y-2 list-disc list-inside">
            <li>Sempre feche e reabra o PWA após grandes atualizações</li>
            <li>Em caso de problemas persistentes, use "Forçar Atualização"</li>
            <li>Se o problema continuar, use "Limpar Todo o Cache"</li>
            <li>Certifique-se de ter conexão com a internet durante atualizações</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheManager;
