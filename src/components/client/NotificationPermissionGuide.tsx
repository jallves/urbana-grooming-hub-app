import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const NotificationPermissionGuide = () => {
  const getBrowserName = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'seu navegador';
  };

  const browser = getBrowserName();

  const instructions: Record<string, string[]> = {
    Chrome: [
      '1. Clique no ícone de **cadeado** 🔒 ou **informações** (ℹ️) na barra de endereços',
      '2. Procure por "Notificações" na lista',
      '3. Mude de "Bloquear" para **"Permitir"**',
      '4. Recarregue a página (F5)',
      '5. Clique novamente em "Ativar Notificações"'
    ],
    Firefox: [
      '1. Clique no ícone de **cadeado** 🔒 na barra de endereços',
      '2. Clique em "Mais informações" ou na setinha',
      '3. Vá para a aba "Permissões"',
      '4. Encontre "Receber notificações" e clique em "X" para limpar',
      '5. Recarregue a página (F5)',
      '6. Clique novamente em "Ativar Notificações"'
    ],
    Safari: [
      '1. Abra Safari → **Preferências** (⌘,)',
      '2. Vá para a aba **"Sites"**',
      '3. Selecione **"Notificações"** no menu lateral',
      '4. Encontre este site e mude para **"Permitir"**',
      '5. Recarregue a página',
      '6. Clique novamente em "Ativar Notificações"'
    ],
    Edge: [
      '1. Clique no ícone de **cadeado** 🔒 na barra de endereços',
      '2. Clique em "Permissões para este site"',
      '3. Procure por "Notificações"',
      '4. Mude de "Bloquear" para **"Permitir"**',
      '5. Recarregue a página (F5)',
      '6. Clique novamente em "Ativar Notificações"'
    ]
  };

  const currentInstructions = instructions[browser] || instructions.Chrome;

  return (
    <Alert variant="destructive" className="border-yellow-600 bg-yellow-950/20">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-yellow-500 font-bold">
        🚫 Notificações Bloqueadas
      </AlertTitle>
      <AlertDescription className="space-y-3 text-yellow-100">
        <p>
          As notificações foram <strong>bloqueadas</strong> no seu navegador. 
          Siga os passos abaixo para desbloquear:
        </p>
        
        <div className="bg-black/30 p-3 rounded-lg space-y-2">
          <p className="font-bold text-yellow-400">📱 Como desbloquear no {browser}:</p>
          <ol className="space-y-2 text-sm">
            {currentInstructions.map((instruction, index) => (
              <li key={index} className="pl-2">
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-950/30 rounded-lg border border-blue-800">
          <span className="text-blue-400 text-xl">💡</span>
          <div className="flex-1 text-sm text-blue-100">
            <strong>Dica:</strong> Se não encontrar a opção de notificações, 
            tente acessar as configurações do navegador e procurar por 
            "Notificações" ou "Permissões de sites".
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          ↻ Recarregar Página
        </Button>

        <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
          <strong>Ainda com problemas?</strong> Entre em contato com o suporte.
        </div>
      </AlertDescription>
    </Alert>
  );
};
