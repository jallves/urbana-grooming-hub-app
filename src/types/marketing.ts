
import { Database } from '@/integrations/supabase/types';

// Define o tipo para campanhas de marketing
export type MarketingCampaign = Database['public']['Tables']['marketing_campaigns']['Row'];

// Define um tipo para novas campanhas (sem id e timestamps)
export type NewMarketingCampaign = Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at'>;

// Define o tipo para cupons de desconto
export type DiscountCoupon = Database['public']['Tables']['discount_coupons']['Row'];

// Define um tipo para novos cupons (sem id e timestamps)
export type NewDiscountCoupon = Omit<DiscountCoupon, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de campanhas
export interface MarketingCampaignFormData {
  name: string;
  description: string | null;
  start_date: Date;
  end_date: Date | null;
  budget: number | null;
  status: 'draft' | 'active' | 'completed' | 'canceled';
}

// Define um tipo para o formulário de cupons
export interface DiscountCouponFormData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: Date;
  valid_until: Date | null;
  max_uses: number | null;
  campaign_id: string | null;
  is_active: boolean;
}
