
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DiscountCoupon, DiscountCouponFormData } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  coupon?: DiscountCoupon | null;
}

const couponSchema = z.object({
  code: z.string().min(3, 'O código deve ter pelo menos 3 caracteres'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('O valor deve ser positivo'),
  valid_from: z.date({ required_error: 'A data de início é obrigatória' }),
  valid_until: z.date().nullable(),
  max_uses: z.number().nullable(),
  campaign_id: z.string().nullable(),
  is_active: z.boolean().default(true),
});

const CouponForm: React.FC<CouponFormProps> = ({ isOpen, onClose, onSubmit, coupon }) => {
  const isEditing = !!coupon;
  const { toast } = useToast();

  // Fetch campaigns for the select dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, name')
        .order('name');
      
      if (error) throw new Error(error.message);
      return data as { id: string; name: string }[];
    },
  });

  const form = useForm<DiscountCouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || '',
      discount_type: coupon?.discount_type as 'percentage' | 'fixed' || 'percentage',
      discount_value: coupon?.discount_value || 0,
      valid_from: coupon ? new Date(coupon.valid_from) : new Date(),
      valid_until: coupon?.valid_until ? new Date(coupon.valid_until) : null,
      max_uses: coupon?.max_uses || null,
      campaign_id: coupon?.campaign_id || null,
      is_active: coupon?.is_active !== undefined ? coupon.is_active : true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DiscountCouponFormData) => {
      console.log('Enviando dados do cupom:', data);
      
      const couponData = {
        code: data.code.toUpperCase(),
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        valid_from: data.valid_from.toISOString().split('T')[0],
        valid_until: data.valid_until ? data.valid_until.toISOString().split('T')[0] : null,
        max_uses: data.max_uses,
        campaign_id: data.campaign_id,
        is_active: data.is_active,
      };

      if (isEditing && coupon) {
        const { data: result, error } = await supabase
          .from('discount_coupons')
          .update({
            ...couponData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', coupon.id)
          .select();

        if (error) {
          console.error('Erro ao atualizar cupom:', error);
          throw new Error(error.message);
        }
        console.log('Cupom atualizado:', result);
      } else {
        const { data: result, error } = await supabase
          .from('discount_coupons')
          .insert(couponData)
          .select();

        if (error) {
          console.error('Erro ao criar cupom:', error);
          throw new Error(error.message);
        }
        console.log('Cupom criado:', result);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: isEditing ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!',
      });
      onSubmit();
      form.reset();
    },
    onError: (error) => {
      console.error('Erro na mutação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar cupom',
        variant: 'destructive',
      });
    },
  });

  const onFormSubmit = form.handleSubmit(async (data) => {
    console.log('Dados do formulário:', data);
    await mutation.mutateAsync(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cupom' : 'Novo Cupom de Desconto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os detalhes do cupom de desconto.'
              : 'Preencha os dados para criar um novo cupom de desconto.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onFormSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Cupom</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: BLACKFRIDAY20"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Um código único que os clientes utilizarão para aplicar o desconto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de desconto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={form.watch('discount_type') === 'percentage' ? '1' : '0.01'}
                        placeholder={
                          form.watch('discount_type') === 'percentage' ? "Ex: 20" : "Ex: 50.00"
                        }
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch('discount_type') === 'percentage'
                        ? 'Valor em porcentagem (sem o símbolo %)'
                        : 'Valor fixo em reais (R$)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Válido a partir de</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Válido até</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Sem data limite</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Deixe em branco para cupons sem data de expiração
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Utilizações</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ilimitado"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para usos ilimitados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaign_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campanha</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "no-campaign" ? null : value)}
                      value={field.value || "no-campaign"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma campanha (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-campaign">Sem campanha</SelectItem>
                        {campaigns?.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associe o cupom a uma campanha (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cupom Ativo</FormLabel>
                    <FormDescription>
                      Desative para suspender temporariamente o uso deste cupom
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Cupom'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponForm;
