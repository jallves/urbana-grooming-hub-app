
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCouponStats = () => {
  return useQuery({
    queryKey: ['marketing-dashboard-coupons'],
    queryFn: async () => {
      const { data: coupons, error } = await supabase
        .from('discount_coupons')
        .select('is_active, current_uses');
      
      if (error) throw new Error(error.message);
      
      const activeCoupons = coupons.filter(c => c.is_active).length;
      const totalUsages = coupons.reduce((sum, coupon) => sum + (coupon.current_uses || 0), 0);
      
      return {
        active: activeCoupons,
        total: coupons.length,
        usages: totalUsages
      };
    },
  });
};
