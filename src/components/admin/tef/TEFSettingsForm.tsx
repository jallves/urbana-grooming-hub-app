import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Settings2 } from 'lucide-react';

interface TEFSettings {
  id: string;
  use_mock: boolean;
  terminal_id: string;
  api_url: string;
  api_key: string | null;
  webhook_url: string | null;
  timeout_seconds: number;
}

const TEFSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<TEFSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tef_settings')
      .select('*')
      .single();

    if (error) {
      toast.error('Erro ao carregar configurações');
      console.error(error);
    } else {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const { error } = await supabase
      .from('tef_settings')
      .update({
        use_mock: settings.use_mock,
        terminal_id: settings.terminal_id,
        api_url: settings.api_url,
        api_key: settings.api_key,
        webhook_url: settings.webhook_url,
        timeout_seconds: settings.timeout_seconds
      })
      .eq('id', settings.id);

    if (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } else {
      toast.success('Configurações salvas com sucesso');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="py-12 text-center">
          <p className="text-red-500">Erro ao carregar configurações</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-black" />
          <CardTitle className="text-black">Configurações TEF</CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          Configure as opções de integração com o TEF PayGo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-1">
            <Label className="text-black font-medium">Modo Homologação (Mock)</Label>
            <p className="text-sm text-gray-600">
              Ativar simulação local para testes
            </p>
          </div>
          <Switch
            checked={settings.use_mock}
            onCheckedChange={(checked) => 
              setSettings({ ...settings, use_mock: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="terminal_id" className="text-black">Terminal ID</Label>
          <Input
            id="terminal_id"
            value={settings.terminal_id || ''}
            onChange={(e) => setSettings({ ...settings, terminal_id: e.target.value })}
            placeholder="TESTE-0001"
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            Identificador do terminal TEF fornecido pela PayGo
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api_url" className="text-black">URL da API</Label>
          <Input
            id="api_url"
            value={settings.api_url || ''}
            onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
            placeholder="https://api.paygo.com.br/tef"
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            {settings.use_mock 
              ? 'URL do mock interno (não precisa alterar)' 
              : 'URL da API real da PayGo TESS'
            }
          </p>
        </div>

        {!settings.use_mock && (
          <div className="space-y-2">
            <Label htmlFor="api_key" className="text-black">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key || ''}
              onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
              placeholder="••••••••••••••••"
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Chave de autenticação fornecida pela PayGo
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="webhook_url" className="text-black">URL Webhook</Label>
          <Input
            id="webhook_url"
            value={settings.webhook_url || ''}
            onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
            placeholder="https://seusite.com/api/webhook/tef"
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            URL para receber notificações de status dos pagamentos
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout" className="text-black">Timeout (segundos)</Label>
          <Input
            id="timeout"
            type="number"
            value={settings.timeout_seconds || 300}
            onChange={(e) => setSettings({ 
              ...settings, 
              timeout_seconds: parseInt(e.target.value) || 300 
            })}
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            Tempo máximo de espera por uma resposta do TEF
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TEFSettingsForm;