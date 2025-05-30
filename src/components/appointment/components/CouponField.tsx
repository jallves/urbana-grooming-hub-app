
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
  servicePrice: number;
  appliedCoupon: any;
  isApplyingCoupon: boolean;
  finalPrice: number;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
}

export function CouponField({ 
  form, 
  servicePrice, 
  appliedCoupon, 
  isApplyingCoupon, 
  finalPrice,
  onApplyCoupon,
  onRemoveCoupon 
}: CouponFieldProps) {
  const [couponCode, setCouponCode] = useState('');

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Por favor, insira um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    console.log('Validando cupom:', couponCode);

    try {
      // Buscar cupom no banco de dados
      const { data: coupon, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
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
      
      if (coupon.discount_type === 'percentage') {
        discountAmount = servicePrice * (coupon.discount_value / 100);
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

      // Garantir que o desconto não seja maior que o preço do serviço
      discountAmount = Math.min(discountAmount, servicePrice);

      // Garantir que o desconto não seja negativo
      if (discountAmount <= 0) {
        toast({
          title: "Cupom inválido",
          description: "Este cupom não oferece desconto válido para este serviço.",
          variant: "destructive",
        });
        return;
      }

      // Aplicar cupom através da função callback
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');

      console.log('Cupom aplicado com sucesso:', {
        code: coupon.code,
        discountAmount,
        originalPrice: servicePrice,
        finalPrice: servicePrice - discountAmount
      });

    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast({
        title: "Erro ao validar cupom",
        description: "Não foi possível validar o cupom. Tente novamente.",
        variant: "destructive",
      });
    }
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
              onClick={onRemoveCoupon}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Valor original:</span>
            <span>R$ {servicePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Desconto ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'Fixo'}):</span>
            <span>- R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-lg border-t pt-1">
            <span>Total a pagar:</span>
            <span className="text-green-600">R$ {finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormLabel>Cupom de Desconto (opcional)</FormLabel>
      <div className="flex gap-2">
        <Input
          placeholder="Digite o código do cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              validateAndApplyCoupon();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={validateAndApplyCoupon}
          disabled={!couponCode.trim() || isApplyingCoupon}
        >
          {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aplicar
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Valor atual: R$ {servicePrice.toFixed(2)}
      </div>
    </div>
  );
}
