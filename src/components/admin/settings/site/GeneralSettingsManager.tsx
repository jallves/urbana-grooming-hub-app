import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Globe, Instagram, Facebook, Twitter } from 'lucide-react';

interface ShopSettings {
  id: string;
  shop_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  website: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_title: string | null;
  about_description: string | null;
  footer_text: string | null;
}

const GeneralSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
      
      return data as unknown as ShopSettings;
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
      const { error } = await supabase
        .from('shop_settings')
        .update(data)
        .eq('id', settings?.id || '');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
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
        <div className="animate-spin h-8 w-8 border-4 border-urbana-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-xl font-playfair font-bold text-gray-900 mb-4">
          📍 Informações Básicas
        </h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="shop_name" className="flex items-center gap-2 font-raleway">
              <Globe className="h-4 w-4" />
              Nome da Barbearia
            </Label>
            <Input
              id="shop_name"
              value={formData.shop_name || ''}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="Costa Urbana Barbearia"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2 font-raleway">
              <MapPin className="h-4 w-4" />
              Endereço
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 font-raleway">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 font-raleway">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@costaurbana.com.br"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Redes Sociais */}
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-xl font-playfair font-bold text-gray-900 mb-4">
          📱 Redes Sociais
        </h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="social_instagram" className="flex items-center gap-2 font-raleway">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              id="social_instagram"
              value={formData.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/costaurbana"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="social_facebook" className="flex items-center gap-2 font-raleway">
              <Facebook className="h-4 w-4" />
              Facebook
            </Label>
            <Input
              id="social_facebook"
              value={formData.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/costaurbana"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="social_twitter" className="flex items-center gap-2 font-raleway">
              <Twitter className="h-4 w-4" />
              Twitter/X
            </Label>
            <Input
              id="social_twitter"
              value={formData.social_twitter || ''}
              onChange={(e) => handleChange('social_twitter', e.target.value)}
              placeholder="https://twitter.com/costaurbana"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Textos do Site */}
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-xl font-playfair font-bold text-gray-900 mb-4">
          ✍️ Textos do Site
        </h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="hero_title" className="font-raleway">
              Título Principal (Hero)
            </Label>
            <Input
              id="hero_title"
              value={formData.hero_title || ''}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              placeholder="Estilo e Tradição em Cada Corte"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero_subtitle" className="font-raleway">
              Subtítulo (Hero)
            </Label>
            <Input
              id="hero_subtitle"
              value={formData.hero_subtitle || ''}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              placeholder="A melhor experiência em barbearia clássica"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="about_title" className="font-raleway">
              Título Sobre Nós
            </Label>
            <Input
              id="about_title"
              value={formData.about_title || ''}
              onChange={(e) => handleChange('about_title', e.target.value)}
              placeholder="Sobre Nós"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="about_description" className="font-raleway">
              Descrição Sobre Nós
            </Label>
            <Textarea
              id="about_description"
              value={formData.about_description || ''}
              onChange={(e) => handleChange('about_description', e.target.value)}
              placeholder="Tradição e excelência em cada atendimento..."
              className="mt-1 min-h-24"
            />
          </div>

          <div>
            <Label htmlFor="footer_text" className="font-raleway">
              Texto do Rodapé
            </Label>
            <Input
              id="footer_text"
              value={formData.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder="Costa Urbana Barbearia - Todos os direitos reservados"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={updateSettingsMutation.isPending}
          className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-raleway font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </form>
  );
};

export default GeneralSettingsManager;
