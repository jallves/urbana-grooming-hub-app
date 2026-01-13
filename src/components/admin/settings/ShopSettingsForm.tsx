import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Building, Phone, Mail, Globe, Instagram, Facebook, Twitter } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface ShopSettingsFormData {
  shop_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  website?: string | null;
  social_instagram?: string | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
}

const shopSettingsSchema = z.object({
  shop_name: z.string().min(3, { message: 'Nome da barbearia é obrigatório' }),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional().or(z.literal('')),
  logo_url: z.string().nullable().optional(),
  website: z.string().url({ message: 'URL do site inválida' }).nullable().optional().or(z.literal('')),
  social_instagram: z.string().nullable().optional(),
  social_facebook: z.string().nullable().optional(),
  social_twitter: z.string().nullable().optional(),
});

const ShopSettingsForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ShopSettingsFormData>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shop_name: '',
      address: '',
      phone: '',
      email: '',
      logo_url: '',
      website: '',
      social_instagram: '',
      social_facebook: '',
      social_twitter: '',
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .eq('key', 'shop_settings')
          .maybeSingle();

        if (error) throw error;

        if (data?.value) {
          const shopData = data.value as unknown as ShopSettingsFormData;
          form.reset({
            shop_name: shopData.shop_name || '',
            address: shopData.address || '',
            phone: shopData.phone || '',
            email: shopData.email || '',
            logo_url: shopData.logo_url || '',
            website: shopData.website || '',
            social_instagram: shopData.social_instagram || '',
            social_facebook: shopData.social_facebook || '',
            social_twitter: shopData.social_twitter || '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        toast.error('Erro ao carregar configurações', { 
          description: (error as Error).message 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const onSubmit = async (values: ShopSettingsFormData) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'shop_settings',
          value: values as unknown as Json
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', { 
        description: (error as Error).message 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="shop_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Nome da Barbearia *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome da sua barbearia" 
                  {...field} 
                  className="bg-white border-gray-300 text-black focus:border-gray-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Endereço</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                    placeholder="Endereço completo" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Telefone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                      placeholder="(00) 00000-0000" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-gray-600">
                  Este número será usado para o botão de WhatsApp no site. Inclua o código do país e DDD.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">E-mail</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                      placeholder="contato@barbearia.com" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">URL do Logo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/logo.png" 
                  {...field} 
                  value={field.value || ''} 
                  className="bg-white border-gray-300 text-black focus:border-gray-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Website</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                    placeholder="https://www.barbearia.com" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <h3 className="text-lg font-medium mb-3 text-black">Redes Sociais</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="social_instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Instagram</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                        placeholder="@barbearia" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Facebook</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                        placeholder="@barbearia" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Twitter</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-10 bg-white border-gray-300 text-black focus:border-gray-500" 
                        placeholder="@barbearia" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ShopSettingsForm;
