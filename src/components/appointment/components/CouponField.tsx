
import React, { useState } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Por favor, insira um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    console.log('Botão aplicar clicado com código:', couponCode);
    
    try {
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
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
              handleApplyCoupon();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyCoupon}
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
