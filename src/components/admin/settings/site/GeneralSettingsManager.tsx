import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Globe, Instagram, Facebook, Twitter, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ShopSettings {
  shop_name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  website: string;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  hero_title: string;
  hero_subtitle: string;
  about_title: string;
  about_description: string;
  footer_text: string;
}

const GeneralSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use the generic settings table with a key-value approach
  const { data: settings, isLoading } = useQuery({
    queryKey: ['general-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'shop_name', 'address', 'phone', 'email', 'logo_url', 'website',
          'social_instagram', 'social_facebook', 'social_twitter',
          'hero_title', 'hero_subtitle', 'about_title', 'about_description', 'footer_text'
        ]);
      
      if (error) throw error;
      
      // Convert array of key-value to object
      const settingsObj: Partial<ShopSettings> = {};
      (data || []).forEach((item: any) => {
        settingsObj[item.key as keyof ShopSettings] = typeof item.value === 'string' ? item.value : String(item.value || '');
      });
      
      return settingsObj as ShopSettings;
    }
  });

  const [formData, setFormData] = useState<Partial<ShopSettings>>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<ShopSettings>) => {
      // Update each setting individually using upsert
      for (const [key, value] of Object.entries(data)) {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key, 
            value: value as any,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleChange = (field: keyof ShopSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card className="p-4 sm:p-6 bg-white border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
          📍 Informações Básicas
        </h3>
        <div className="grid gap-3 sm:gap-4">
          <div>
            <Label htmlFor="shop_name" className="flex items-center gap-2 text-sm">
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Nome da Barbearia
            </Label>
            <Input
              id="shop_name"
              value={formData.shop_name || ''}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="Costa Urbana Barbearia"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Endereço
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@costaurbana.com.br"
                className="mt-1 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Redes Sociais */}
      <Card className="p-4 sm:p-6 bg-white border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
          📱 Redes Sociais
        </h3>
        <div className="grid gap-3 sm:gap-4">
          <div>
            <Label htmlFor="social_instagram" className="flex items-center gap-2 text-sm">
              <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Instagram
            </Label>
            <Input
              id="social_instagram"
              value={formData.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/costaurbana"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="social_facebook" className="flex items-center gap-2 text-sm">
              <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Facebook
            </Label>
            <Input
              id="social_facebook"
              value={formData.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/costaurbana"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="social_twitter" className="flex items-center gap-2 text-sm">
              <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Twitter/X
            </Label>
            <Input
              id="social_twitter"
              value={formData.social_twitter || ''}
              onChange={(e) => handleChange('social_twitter', e.target.value)}
              placeholder="https://twitter.com/costaurbana"
              className="mt-1 text-sm sm:text-base"
            />
          </div>
        </div>
      </Card>

      {/* Textos do Site */}
      <Card className="p-4 sm:p-6 bg-white border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
          ✍️ Textos do Site
        </h3>
        <div className="grid gap-3 sm:gap-4">
          <div>
            <Label htmlFor="hero_title" className="text-sm">
              Título Principal (Hero)
            </Label>
            <Input
              id="hero_title"
              value={formData.hero_title || ''}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              placeholder="Estilo e Tradição em Cada Corte"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="hero_subtitle" className="text-sm">
              Subtítulo (Hero)
            </Label>
            <Input
              id="hero_subtitle"
              value={formData.hero_subtitle || ''}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              placeholder="A melhor experiência em barbearia clássica"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="about_title" className="text-sm">
              Título Sobre Nós
            </Label>
            <Input
              id="about_title"
              value={formData.about_title || ''}
              onChange={(e) => handleChange('about_title', e.target.value)}
              placeholder="Sobre Nós"
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="about_description" className="text-sm">
              Descrição Sobre Nós
            </Label>
            <Textarea
              id="about_description"
              value={formData.about_description || ''}
              onChange={(e) => handleChange('about_description', e.target.value)}
              placeholder="Tradição e excelência em cada atendimento..."
              className="mt-1 min-h-24 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="footer_text" className="text-sm">
              Texto do Rodapé
            </Label>
            <Input
              id="footer_text"
              value={formData.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder="Costa Urbana Barbearia - Todos os direitos reservados"
              className="mt-1 text-sm sm:text-base"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={updateSettingsMutation.isPending}
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </form>
  );
};

export default GeneralSettingsManager;
