import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { DAY_LABELS, DEFAULT_BUSINESS_HOURS, type BusinessHours, type ShopSettings } from '@/hooks/useShopSettings';

const DEFAULT_CONTACT: ShopSettings = {
  address: 'Rua Castelo Branco, 483 - 29101-480 Praia da Costa - Vila Velha/ES',
  phone: '(27) 99778-0137',
  email: 'costaurbanabarbershop@gmail.com',
};

const ContactHoursManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-settings-json'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shop_settings')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as ShopSettings) || null;
    },
  });

  const [form, setForm] = useState<ShopSettings>({});
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);

  useEffect(() => {
    // Pré-preenche com os valores atualmente exibidos no site quando ainda não há dados salvos
    setForm({
      ...DEFAULT_CONTACT,
      ...(data || {}),
      address: data?.address || DEFAULT_CONTACT.address,
      phone: data?.phone || DEFAULT_CONTACT.phone,
      email: data?.email || DEFAULT_CONTACT.email,
    });
    if (data?.business_hours) {
      setHours({ ...DEFAULT_BUSINESS_HOURS, ...data.business_hours });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, business_hours: hours };
      const { data: saved, error } = await supabase
        .from('settings')
        .upsert(
          { key: 'shop_settings', value: payload as any, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select('value')
        .maybeSingle();
      if (error) throw error;
      if (!saved) {
        throw new Error('Sem permissão para salvar (nenhuma linha gravada). Faça login como administrador master.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings-json'] });
      toast({ title: 'Configurações salvas', description: 'As informações já estão refletidas no site.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  const setDay = (day: number, patch: Partial<BusinessHours[number]>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
      className="space-y-5"
    >
      <Card className="p-4 sm:p-6 bg-white border-amber-200">
        <h3 className="text-base sm:text-lg font-playfair font-bold text-amber-900 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Horário de Funcionamento
        </h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const cfg = hours[day] || DEFAULT_BUSINESS_HOURS[day];
            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-amber-100 rounded-lg p-3 bg-amber-50/40"
              >
                <span className="font-raleway font-semibold text-sm text-amber-900 w-full sm:w-40">
                  {DAY_LABELS[day]}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!cfg.closed}
                    onCheckedChange={(v) => setDay(day, { closed: !v })}
                  />
                  <span className="text-xs font-raleway text-amber-700 w-16">
                    {cfg.closed ? 'Fechado' : 'Aberto'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={cfg.open}
                    disabled={cfg.closed}
                    onChange={(e) => setDay(day, { open: e.target.value })}
                    className="w-32 text-sm"
                  />
                  <span className="text-amber-700 text-sm">às</span>
                  <Input
                    type="time"
                    value={cfg.close}
                    disabled={cfg.closed}
                    onChange={(e) => setDay(day, { close: e.target.value })}
                    className="w-32 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 bg-white border-amber-200">
        <h3 className="text-base sm:text-lg font-playfair font-bold text-amber-900 mb-4">
          📇 Informações de Contato
        </h3>
        <div className="grid gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> Endereço
            </Label>
            <Input
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Rua Castelo Branco, 483 - Praia da Costa - Vila Velha/ES"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" /> Telefone
              </Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(27) 99778-0137"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" /> E-mail
              </Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="costaurbanabarbershop@gmail.com"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-amber-900 hover:bg-amber-800 text-amber-50 font-raleway"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar e publicar no site'}
        </Button>
      </div>
    </form>
  );
};

export default ContactHoursManager;
