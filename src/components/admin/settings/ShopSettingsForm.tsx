
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ShopSettingsFormData } from '@/types/settings';

const shopSettingsSchema = z.object({
  shop_name: z.string().min(3, { message: 'Nome da barbearia é obrigatório' }),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional(),
  logo_url: z.string().nullable().optional(),
  website: z.string().url({ message: 'URL do site inválida' }).nullable().optional(),
  social_instagram: z.string().nullable().optional(),
  social_facebook: z.string().nullable().optional(),
  social_twitter: z.string().nullable().optional(),
});

const ShopSettingsForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

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
          .from('shop_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettingsId(data.id);
          form.reset({
            shop_name: data.shop_name,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            logo_url: data.logo_url || '',
            website: data.website || '',
            social_instagram: data.social_instagram || '',
            social_facebook: data.social_facebook || '',
            social_twitter: data.social_twitter || '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const onSubmit = async (values: ShopSettingsFormData) => {
    try {
      setIsSaving(true);

      const settingsData = {
        shop_name: values.shop_name,
        address: values.address || null,
        phone: values.phone || null,
        email: values.email || null,
        logo_url: values.logo_url || null,
        website: values.website || null,
        social_instagram: values.social_instagram || null,
        social_facebook: values.social_facebook || null,
        social_twitter: values.social_twitter || null,
      };

      if (settingsId) {
        const { error } = await supabase
          .from('shop_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shop_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white border border-gray-200">
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Informações da Barbearia
            </CardTitle>
            <CardDescription className="text-gray-600">
              Configure as informações básicas da sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="shop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 font-medium">Nome da Barbearia *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome da sua barbearia" 
                      {...field} 
                      className="bg-white border-gray-300 text-gray-900"
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
                  <FormLabel className="text-gray-900 font-medium">Endereço</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-10 bg-white border-gray-300 text-gray-900" 
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
                    <FormLabel className="text-gray-900 font-medium">Telefone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input 
                          className="pl-10 bg-white border-gray-300 text-gray-900" 
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
                    <FormLabel className="text-gray-900 font-medium">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input 
                          className="pl-10 bg-white border-gray-300 text-gray-900" 
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
                  <FormLabel className="text-gray-900 font-medium">URL do Logo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/logo.png" 
                      {...field} 
                      value={field.value || ''} 
                      className="bg-white border-gray-300 text-gray-900"
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
                  <FormLabel className="text-gray-900 font-medium">Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-10 bg-white border-gray-300 text-gray-900" 
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
              <h3 className="text-lg font-medium mb-3 text-gray-900">Redes Sociais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="social_instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Instagram</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            className="pl-10 bg-white border-gray-300 text-gray-900" 
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
                      <FormLabel className="text-gray-900 font-medium">Facebook</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            className="pl-10 bg-white border-gray-300 text-gray-900" 
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
                      <FormLabel className="text-gray-900 font-medium">Twitter</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            className="pl-10 bg-white border-gray-300 text-gray-900" 
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default ShopSettingsForm;
