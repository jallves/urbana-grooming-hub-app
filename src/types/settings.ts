
import { Database } from '@/integrations/supabase/types';

// Define o tipo para configurações da barbearia
export type ShopSettings = Database['public']['Tables']['shop_settings']['Row'];

// Define um tipo para o formulário de configurações
export interface ShopSettingsFormData {
  shop_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  website: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
}
