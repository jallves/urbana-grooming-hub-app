
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
    if (!couponCode || !appointmentId) return;

    setIsApplying(true);
    try {
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
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o cupom.",
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
                disabled={!field.value || isApplying || !appointmentId}
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
