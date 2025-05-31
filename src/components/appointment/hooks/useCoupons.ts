
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';

export const useCoupons = (selectedService: Service | null) => {
  const { toast } = useToast();
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [finalServicePrice, setFinalServicePrice] = useState(0);

  const applyCoupon = useCallback(async (couponCode: string) => {
    if (!couponCode || !selectedService) return;

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode)
        .single();

      if (error) {
        console.error("Erro ao buscar cupom:", error);
        toast({
          title: "Cupom inválido",
          description: "Cupom não encontrado ou inválido.",
          variant: "destructive",
        });
        setAppliedCoupon(null);
        setFinalServicePrice(selectedService.price);
        return;
      }

      if (data) {
        // Check if the coupon is expired
        if (data.valid_until && new Date(data.valid_until) < new Date()) {
          toast({
            title: "Cupom expirado",
            description: "Este cupom expirou.",
            variant: "destructive",
          });
          setAppliedCoupon(null);
          setFinalServicePrice(selectedService.price);
          return;
        }

        setAppliedCoupon({ code: data.code, discountAmount: data.discount_value });
        setFinalServicePrice(selectedService.price - data.discount_value);
        toast({
          title: "Cupom aplicado",
          description: `Cupom ${data.code} aplicado com sucesso!`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar cupom:", error);
      toast({
        title: "Cupom inválido",
        description: "Cupom não encontrado ou inválido.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setFinalServicePrice(selectedService?.price || 0);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [selectedService, toast]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setFinalServicePrice(selectedService?.price || 0);
    toast({
      title: "Cupom removido",
      description: "Cupom removido com sucesso!",
    });
  }, [selectedService, toast]);

  return {
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice,
    setFinalServicePrice,
    applyCoupon,
    removeCoupon,
  };
};
