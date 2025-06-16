
import React, { useState } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CouponFieldProps {
  appliedCoupon: { code: string; discountAmount: number } | null;
  isApplyingCoupon: boolean;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  servicePrice?: number;
}

export function CouponField({ 
  appliedCoupon, 
  isApplyingCoupon, 
  onApplyCoupon,
  onRemoveCoupon,
  servicePrice = 0
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

    console.log('Aplicando cupom:', couponCode);
    
    try {
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
    }
  };

  if (appliedCoupon) {
    const finalPrice = servicePrice - appliedCoupon.discountAmount;
    
    return (
      <div className="space-y-3">
        <FormLabel className="text-white">Cupom de Desconto</FormLabel>
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
        <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Valor original:</span>
            <span className="line-through text-gray-500">R$ {servicePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto:</span>
            <span>- R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-green-200 pt-2">
            <span>Valor final:</span>
            <span className="text-green-600">R$ {finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormLabel className="text-white">Cupom de Desconto (opcional)</FormLabel>
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
          className="bg-stone-700 border-stone-600 text-white"
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
      <div className="text-sm text-stone-400">
        Valor atual: R$ {servicePrice.toFixed(2)}
      </div>
    </div>
  );
}
