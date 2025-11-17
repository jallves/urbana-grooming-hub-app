import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Key, CheckCircle, Bell, ExternalLink, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

const VapidKeyGenerator: React.FC = () => {
  const [keys, setKeys] = useState<VapidKeys | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testClientId, setTestClientId] = useState<string>('');
  const { toast } = useToast();

  const { data: clients } = useQuery({
    queryKey: ['clients-for-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, email')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const generateKeys = async () => {
    setIsGenerating(true);
    try {
      // Generate ECDSA P-256 key pair for VAPID
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

      setKeys({
        publicKey: urlBase64(publicKeyBase64),
        privateKey: urlBase64(privateKeyBase64)
      });

      toast({
        title: "✅ VAPID Keys Geradas!",
        description: "As chaves foram geradas com sucesso.",
      });
    } catch (error) {
      console.error('Error generating VAPID keys:', error);
      toast({
        title: "❌ Erro ao Gerar Keys",
        description: "Ocorreu um erro ao gerar as VAPID keys.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const urlBase64 = (base64: string): string => {
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "📋 Copiado!",
        description: `${field} copiada para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao Copiar",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const handleSendTestNotification = async () => {
    if (!testClientId) {
      toast({
        title: "❌ Erro",
        description: "Selecione um cliente para enviar a notificação de teste",
        variant: "destructive"
      });
      return;
    }

    setIsSendingTest(true);
    
    // Mostrar toast de loading
    toast({
      title: "📤 Enviando notificação...",
      description: "Aguarde...",
    });

    try {
      console.log('🧪 Enviando notificação de teste para cliente:', testClientId);
      
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        body: { clientId: testClientId }
      });

      console.log('📨 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw error;
      }

      if (data?.success) {
        toast({
          title: "✅ Sucesso!",
          description: data.message || `Notificação enviada! (${data.stats?.success || 0} enviadas)`,
          duration: 7000
        });
      } else {
        // Cliente sem tokens ativos
        toast({
          title: "⚠️ Cliente sem notificações ativas",
          description: data.message || "Este cliente ainda não ativou as notificações push no painel dele. Peça para ele ativar primeiro!",
          variant: "default",
          duration: 10000
        });
      }
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      toast({
        title: "❌ Erro ao Enviar",
        description: error.message || "Erro desconhecido ao enviar notificação",
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instruções Passo-a-Passo */}
      <Alert className="bg-blue-50 border-blue-200">
        <Bell className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <div className="space-y-2">
            <strong className="block text-base mb-2">📋 Como Configurar Notificações Push (Passo-a-Passo):</strong>
            <ol className="space-y-1 text-sm list-decimal list-inside">
              <li><strong>1. Gerar Chaves VAPID</strong> - Clique no botão abaixo para gerar as chaves</li>
              <li><strong>2. Configurar no Supabase</strong> - Copie as chaves e adicione nos Secrets do projeto:
                <ul className="ml-6 mt-1 list-disc list-inside text-xs">
                  <li><code className="bg-blue-100 px-1 rounded">VAPID_PUBLIC_KEY</code> (chave pública)</li>
                  <li><code className="bg-blue-100 px-1 rounded">VAPID_PRIVATE_KEY</code> (chave privada - secreta!)</li>
                  <li><code className="bg-blue-100 px-1 rounded">VAPID_EMAIL</code> (seu email, ex: admin@seusite.com)</li>
                </ul>
              </li>
              <li><strong>3. Testar</strong> - Selecione um cliente e envie uma notificação de teste</li>
              <li><strong>4. Cliente Ativa</strong> - O cliente precisa ativar notificações no painel dele primeiro!</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Passo 1: Gerar VAPID Keys
          </CardTitle>
          <CardDescription>
            Gere as chaves de autenticação para notificações push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>O que são VAPID Keys?</strong>
              <br />
              São chaves de autenticação necessárias para enviar notificações push do navegador.
              Você precisa gerar essas chaves apenas uma vez e configurá-las nos secrets do Supabase.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button
              onClick={generateKeys}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Gerar VAPID Keys
                </>
              )}
            </Button>

            {keys && (
              <div className="space-y-4 animate-in fade-in-50">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Chaves geradas com sucesso! Copie as chaves abaixo.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      🔓 VAPID Public Key (Chave Pública)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={keys.publicKey}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(keys.publicKey, 'Chave Pública')}
                      >
                        {copiedField === 'Chave Pública' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Use esta chave no arquivo <code>.env</code> como <code>VITE_VAPID_PUBLIC_KEY</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      🔐 VAPID Private Key (Chave Privada)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={keys.privateKey}
                        readOnly
                        type="password"
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(keys.privateKey, 'Chave Privada')}
                      >
                        {copiedField === 'Chave Privada' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      🔒 Use esta chave como secret no Supabase: <code>VAPID_PRIVATE_KEY</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">Criar arquivo .env na raiz do projeto</p>
                <p className="text-sm text-muted-foreground">
                  Adicione: <code className="bg-muted px-1 py-0.5 rounded">VITE_VAPID_PUBLIC_KEY=sua_chave_publica</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">Configurar Secrets no Supabase</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Adicione 3 secrets no Supabase Edge Functions:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 py-0.5 rounded">VAPID_PUBLIC_KEY</code></li>
                  <li>• <code className="bg-muted px-1 py-0.5 rounded">VAPID_PRIVATE_KEY</code></li>
                  <li>• <code className="bg-muted px-1 py-0.5 rounded">VAPID_EMAIL</code> (exemplo: mailto:seu@email.com)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">Testar as Notificações</p>
                <p className="text-sm text-muted-foreground">
                  Acesse o painel do cliente e ative as notificações quando solicitado
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://supabase.com/dashboard/project/bqftkknbvmggcbsubicl/settings/functions', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Secrets do Supabase
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Passo 3: Testar Notificações
          </CardTitle>
          <CardDescription>
            Envie uma notificação de teste para verificar se está funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <Bell className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">
              <strong>⚠️ IMPORTANTE:</strong> O cliente precisa ter <strong>ativado as notificações</strong> no painel dele primeiro! 
              <br className="my-1" />
              Se o teste falhar com "nenhum token ativo", peça ao cliente para acessar o Painel Cliente e ativar as notificações push.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={testClientId} onValueChange={setTestClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome} - {client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSendTestNotification}
            disabled={isSendingTest || !testClientId}
            className="w-full"
          >
            {isSendingTest ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Notificação de Teste
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <strong>ℹ️ Como funciona:</strong>
          <br />
          Após configurar, o sistema enviará notificações automáticas aos clientes:
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• <strong>24 horas antes</strong> do agendamento</li>
            <li>• <strong>4 horas antes</strong> do agendamento</li>
          </ul>
          <br />
          As notificações são enviadas pelo próprio navegador/sistema operacional, sem usar email ou WhatsApp.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VapidKeyGenerator;
