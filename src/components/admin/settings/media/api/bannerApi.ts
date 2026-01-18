import { supabase } from '@/integrations/supabase/client';
import { BannerImage } from '@/types/settings';

/**
 * Busca todos os banners ativos ordenados por display_order
 */
export const fetchBannerImages = async (): Promise<BannerImage[]> => {
  console.log('🖼️ [BannerAPI] Buscando banners...');
  
  const { data, error } = await supabase
    .from('banner_images')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao buscar banners:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Banners encontrados:', data?.length || 0);
  
  if (data && data.length > 0) {
    return data.map(item => ({
      id: item.id,
      image_url: item.image_url,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      button_text: item.button_text || 'Agendar Agora',
      button_link: item.button_link || '/painel-cliente/login',
      is_active: item.is_active,
      display_order: item.display_order
    }));
  }
  
  return [];
};

/**
 * Cria um novo banner
 */
export const createBanner = async (newBanner: {
  image_url: string;
  title: string;
  subtitle: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  display_order: number;
}) => {
  console.log('📤 [BannerAPI] Criando banner:', newBanner.title);
  
  const { data, error } = await supabase
    .from('banner_images')
    .insert({
      image_url: newBanner.image_url,
      title: newBanner.title,
      subtitle: newBanner.subtitle,
      description: newBanner.description || '',
      button_text: newBanner.button_text || 'Agendar Agora',
      button_link: newBanner.button_link || '/painel-cliente/login',
      display_order: newBanner.display_order,
      is_active: true
    })
    .select();
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao criar banner:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Banner criado com sucesso:', data);
  return data;
};

/**
 * Atualiza um banner existente
 */
export const updateBanner = async (banner: {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  is_active?: boolean;
}) => {
  console.log('📝 [BannerAPI] Atualizando banner:', banner.id);
  
  const { data, error } = await supabase
    .from('banner_images')
    .update({
      image_url: banner.image_url,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      button_text: banner.button_text,
      button_link: banner.button_link,
      is_active: banner.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', banner.id)
    .select();
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao atualizar banner:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Banner atualizado com sucesso');
  return data;
};

/**
 * Deleta um banner pelo ID
 */
export const deleteBanner = async (bannerId: string) => {
  console.log('🗑️ [BannerAPI] Deletando banner:', bannerId);
  
  const { error } = await supabase
    .from('banner_images')
    .delete()
    .eq('id', bannerId);
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao deletar banner:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Banner deletado com sucesso');
};

/**
 * Atualiza a ordem de exibição de um banner
 */
export const updateBannerOrder = async (bannerId: string, displayOrder: number) => {
  console.log('🔄 [BannerAPI] Atualizando ordem do banner:', bannerId, '→', displayOrder);
  
  const { error } = await supabase
    .from('banner_images')
    .update({ 
      display_order: displayOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', bannerId);
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao atualizar ordem:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Ordem atualizada com sucesso');
};

/**
 * Toggle status ativo/inativo de um banner
 */
export const toggleBannerActive = async (bannerId: string, isActive: boolean) => {
  console.log('🔄 [BannerAPI] Toggle banner ativo:', bannerId, '→', isActive);
  
  const { error } = await supabase
    .from('banner_images')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', bannerId);
  
  if (error) {
    console.error('❌ [BannerAPI] Erro ao alternar status:', error);
    throw error;
  }
  
  console.log('✅ [BannerAPI] Status atualizado com sucesso');
};
