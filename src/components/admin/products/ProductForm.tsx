
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProductImageUpload } from './ProductImageUpload';

interface ProductFormProps {
  productId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const normalizeProductName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const productFormSchema = z
  .object({
    name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
    description: z.string().nullable().optional(),
    price: z.coerce.number().min(0, { message: 'O preço não pode ser negativo' }),
    cost_price: z.coerce.number().nonnegative().nullable().optional(),
    stock_quantity: z.coerce.number().int().nonnegative().nullable().optional(),
    is_active: z.boolean().default(true),
    images: z.array(z.string()).default([]),
    commission_value: z.coerce.number().nonnegative().nullable().optional(),
    commission_percentage: z.coerce.number().nonnegative().nullable().optional(),
  })
  .superRefine(({ name, price }, ctx) => {
    const normalized = normalizeProductName(name);
    const isCafe = normalized.includes('cafe');

    if (price === 0 && !isCafe) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Somente o produto Café pode ter preço R$ 0,00',
      });
    }
  });

type ProductFormValues = z.infer<typeof productFormSchema>;

const ProductForm: React.FC<ProductFormProps> = ({ productId, onCancel, onSuccess }) => {
  const isEditing = !!productId;

  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      is_active: true,
      images: [],
      commission_value: 0,
      commission_percentage: 0,
    },
    values: productData ? {
      name: productData.nome || '',
      description: productData.descricao || '',
      price: productData.preco || 0,
      cost_price: 0,
      stock_quantity: productData.estoque || 0,
      is_active: productData.ativo ?? true,
      images: (() => {
        if (!productData.imagem_url) return [];
        try {
          const parsed = JSON.parse(productData.imagem_url);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        // Legacy: single URL string
        return [productData.imagem_url];
      })(),
      commission_value: productData.commission_value || 0,
      commission_percentage: productData.commission_percentage || 0,
    } : undefined,
  });
  
  // Watch price and commission fields for display purposes
  const price = form.watch('price');
  const commissionValue = form.watch('commission_value');
  const commissionPercentage = form.watch('commission_percentage');
  
  // Flag to prevent infinite loops during calculation
  const isCalculatingRef = React.useRef(false);
  
  // Recalculate percentage when price changes (keep value, update percentage)
  React.useEffect(() => {
    if (isCalculatingRef.current) return;
    if (price > 0 && commissionValue && commissionValue > 0) {
      isCalculatingRef.current = true;
      const percentage = (commissionValue / price) * 100;
      form.setValue('commission_percentage', parseFloat(percentage.toFixed(2)), { shouldValidate: false });
      setTimeout(() => { isCalculatingRef.current = false; }, 0);
    }
  }, [price]); // Only when price changes
  
  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: ProductFormValues) => {
    try {
      console.log('📤 Salvando produto com imagens:', values.images);
      
      if (isEditing) {
        const updateData = {
          nome: values.name,
          descricao: values.description,
          preco: values.price,
          estoque: values.stock_quantity || 0,
          ativo: values.is_active,
          imagem_url: values.images.length > 0 ? JSON.stringify(values.images) : null,
          commission_value: values.commission_value || 0,
          commission_percentage: values.commission_percentage || 0,
        };
        
        console.log('📝 Update data:', updateData);
        
        const { error, data } = await supabase
          .from('painel_produtos')
          .update(updateData)
          .eq('id', productId)
          .select();

        if (error) {
          console.error('❌ Erro no update:', error);
          throw error;
        }
        
        console.log('✅ Produto atualizado:', data);
        toast.success('Produto atualizado com sucesso!');
      } else {
        const productData = {
          nome: values.name,
          descricao: values.description || null,
          preco: values.price,
          estoque: values.stock_quantity || 0,
          categoria: 'Geral',
          imagem_url: values.images.length > 0 ? JSON.stringify(values.images) : null,
          ativo: values.is_active,
          commission_value: values.commission_value || 0,
          commission_percentage: values.commission_percentage || 0,
        };

        console.log('📝 Insert data:', productData);

        const { error, data } = await supabase
          .from('painel_produtos')
          .insert([productData])
          .select();

        if (error) {
          console.error('❌ Erro no insert:', error);
          throw error;
        }
        
        console.log('✅ Produto criado:', data);
        toast.success('Produto criado com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar produto', {
        description: (error as Error).message
      });
    }
  };

  if (isEditing && isLoadingProduct) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pomada Modeladora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o produto, suas características e benefícios" 
                      {...field} 
                      value={field.value || ''}
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 p-4 bg-muted/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">Produto Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Produtos ativos podem ser vendidos no totem
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Imagens do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductImageUpload
                      images={field.value}
                      onImagesChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0,00" 
                          {...field}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comissão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comissão do Barbeiro</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure a comissão por valor fixo ou porcentagem sobre o preço de venda
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Comissão</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            field.onChange(val);
                            // Calculate percentage based on value
                            const currentPrice = form.getValues('price');
                            if (currentPrice > 0) {
                              const percentage = (val / currentPrice) * 100;
                              form.setValue('commission_percentage', parseFloat(percentage.toFixed(2)), { shouldValidate: false });
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Insira o valor em reais
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="commission_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentagem da Comissão</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ''}
                          className="pr-8"
                          onChange={(e) => {
                            const percentage = parseFloat(e.target.value) || 0;
                            field.onChange(percentage);
                            // Calculate value based on percentage
                            const currentPrice = form.getValues('price');
                            if (currentPrice > 0) {
                              const value = (currentPrice * percentage) / 100;
                              form.setValue('commission_value', parseFloat(value.toFixed(2)), { shouldValidate: false });
                            }
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Insira a porcentagem sobre o preço
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {price > 0 && (commissionValue > 0 || commissionPercentage > 0) && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Resumo da Comissão:</span> Para um produto de{' '}
                  <span className="font-semibold text-primary">R$ {Number(price).toFixed(2)}</span>, o barbeiro receberá{' '}
                  <span className="font-semibold text-primary">R$ {Number(commissionValue || 0).toFixed(2)}</span>{' '}
                  ({Number(commissionPercentage || 0).toFixed(2)}%) por venda
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controle de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Estoque</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0" 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantidade disponível para venda
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />
        
        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
