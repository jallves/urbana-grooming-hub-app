import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { usePWAContext } from '@/hooks/usePWAContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, MoreVertical, Home } from 'lucide-react';

const InstallContext: React.FC = () => {
  const { context } = useParams<{ context: string }>();
  const { manifest, isIOS, isAndroid } = usePWAContext();

  if (!context || !['admin', 'barbeiro', 'painel-cliente', 'totem', 'public'].includes(context)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Instalar {manifest.short_name}
          </h1>
          <p className="text-muted-foreground">
            {manifest.description}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Como Instalar
            </CardTitle>
            <CardDescription>
              Siga as instruções para o seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isIOS && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  iPhone / iPad
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Toque no botão <Share className="inline h-3 w-3" /> (Compartilhar) na barra inferior</li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Toque em "Adicionar" no canto superior direito</li>
                  <li>O app aparecerá na sua tela inicial</li>
                </ol>
              </div>
            )}

            {isAndroid && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Android
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Toque no menu <MoreVertical className="inline h-3 w-3" /> (três pontos) no canto superior</li>
                  <li>Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
                  <li>Confirme tocando em "Instalar"</li>
                  <li>O app aparecerá na sua tela inicial</li>
                </ol>
              </div>
            )}

            {!isIOS && !isAndroid && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Desktop
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Clique no ícone de instalação na barra de endereços</li>
                  <li>Ou acesse o menu do navegador e selecione "Instalar {manifest.short_name}"</li>
                  <li>Confirme a instalação</li>
                  <li>O app será aberto em uma janela separada</li>
                </ol>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <h3 className="font-semibold text-sm">Benefícios da Instalação</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Acesso rápido direto da tela inicial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Funciona offline após instalação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Atualizações automáticas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Experiência nativa sem a barra do navegador</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => window.location.href = manifest.start_url}
              className="w-full"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar para {manifest.short_name}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstallContext;
