
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CouponFieldProps {
  form: any;
  appointmentId?: string;
  servicePrice?: number;
  onCouponApplied?: (discount: number) => void;
}

interface CouponResponse {
  success: boolean;
  discount_amount?: number;
  final_amount?: number;
  error?: string;
}

const CouponField: React.FC<CouponFieldProps> = ({ 
  form, 
  appointmentId, 
  servicePrice,
  onCouponApplied 
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    finalAmount: number;
  } | null>(null);

  const applyCoupon = async () => {
    const couponCode = form.getValues('couponCode');
    if (!couponCode) {
      toast({
        title: "Código necessário",
        description: "Por favor, insira um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      if (appointmentId) {
        // Para agendamentos existentes, usar a função RPC
        const { data, error } = await supabase.rpc('apply_coupon_to_appointment', {
          p_appointment_id: appointmentId,
          p_coupon_code: couponCode
        });

        if (error) throw error;

        const response = data as unknown as CouponResponse;

        if (response.success) {
          setAppliedCoupon({
            code: couponCode,
            discount: response.discount_amount || 0,
            finalAmount: response.final_amount || 0
          });
          
          form.setValue('discountAmount', response.discount_amount || 0);
          onCouponApplied?.(response.discount_amount || 0);
          
          toast({
            title: "Cupom aplicado!",
            description: `Desconto de R$ ${(response.discount_amount || 0).toFixed(2)} aplicado com sucesso.`,
          });
        } else {
          toast({
            title: "Erro ao aplicar cupom",
            description: response.error || "Erro desconhecido",
            variant: "destructive",
          });
        }
      } else {
        // Para novos agendamentos, validar o cupom manualmente
        console.log('Validando cupom para novo agendamento:', couponCode);

        const { data: coupon, error } = await supabase
          .from('discount_coupons')
          .select('*')
          .eq('code', couponCode.toUpperCase())
          .single();

        if (error || !coupon) {
          console.log('Cupom não encontrado:', error);
          toast({
            title: "Cupom inválido",
            description: "O cupom informado não foi encontrado em nosso sistema.",
            variant: "destructive",
          });
          return;
        }

        console.log('Cupom encontrado:', coupon);

        // Verificar se o cupom está ativo
        if (!coupon.is_active) {
          toast({
            title: "Cupom inativo",
            description: "Este cupom não está mais ativo.",
            variant: "destructive",
          });
          return;
        }

        // Verificar data de início
        const today = new Date().toISOString().split('T')[0];
        if (coupon.valid_from > today) {
          toast({
            title: "Cupom ainda não válido",
            description: `Este cupom só será válido a partir de ${format(new Date(coupon.valid_from), 'dd/MM/yyyy', { locale: ptBR })}.`,
            variant: "destructive",
          });
          return;
        }

        // Verificar data de expiração
        if (coupon.valid_until && coupon.valid_until < today) {
          toast({
            title: "Cupom expirado",
            description: `Este cupom expirou em ${format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })}.`,
            variant: "destructive",
          });
          return;
        }

        // Verificar limite de uso
        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
          toast({
            title: "Cupom esgotado",
            description: "Este cupom já atingiu o limite máximo de utilizações.",
            variant: "destructive",
          });
          return;
        }

        // Calcular desconto
        let discountAmount = 0;
        const price = servicePrice || 0;
        
        if (coupon.discount_type === 'percentage') {
          discountAmount = price * (coupon.discount_value / 100);
          // Validar se a porcentagem não é maior que 100%
          if (coupon.discount_value > 100) {
            toast({
              title: "Erro no cupom",
              description: "Este cupom possui uma configuração inválida.",
              variant: "destructive",
            });
            return;
          }
        } else {
          discountAmount = coupon.discount_value;
        }

        // Garantir que o desconto não seja maior que o preço
        discountAmount = Math.min(discountAmount, price);
        
        // Garantir que o desconto não seja negativo
        if (discountAmount <= 0) {
          toast({
            title: "Cupom inválido",
            description: "Este cupom não oferece desconto válido para este serviço.",
            variant: "destructive",
          });
          return;
        }

        const finalAmount = price - discountAmount;

        setAppliedCoupon({
          code: coupon.code,
          discount: discountAmount,
          finalAmount
        });
        
        form.setValue('discountAmount', discountAmount);
        onCouponApplied?.(discountAmount);
        
        toast({
          title: "Cupom aplicado com sucesso!",
          description: `Desconto de R$ ${discountAmount.toFixed(2)} aplicado. ${coupon.discount_type === 'percentage' ? `(${coupon.discount_value}%)` : ''}`,
        });

        console.log('Cupom aplicado:', {
          code: coupon.code,
          discountAmount,
          originalPrice: price,
          finalPrice: finalAmount
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      toast({
        title: "Erro ao validar cupom",
        description: "Não foi possível validar o cupom. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    form.setValue('couponCode', '');
    form.setValue('discountAmount', 0);
    onCouponApplied?.(0);
    
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do agendamento.",
    });
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-2">
        <FormLabel>Cupom de Desconto</FormLabel>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {appliedCoupon.code}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={removeCoupon}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Desconto: R$ {appliedCoupon.discount.toFixed(2)}
          {servicePrice && (
            <span> • Total: R$ {appliedCoupon.finalAmount.toFixed(2)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name="couponCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cupom de Desconto</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  placeholder="Digite o código do cupom"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                disabled={!field.value || isApplying}
              >
                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CouponField;
