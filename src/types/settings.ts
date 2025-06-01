
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

// Define tipos para as configurações do banner rotativo - updated to match database
export interface BannerImage {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  display_order: number;
}

// Define tipos para as imagens da galeria
export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

// Define uma interface para as configurações de mídia
export interface MediaSettings {
  bannerImages: BannerImage[];
  galleryImages: GalleryImage[];
}

// Define um tipo para o upload de imagem
export interface ImageUpload {
  file: File;
  previewUrl: string;
}
