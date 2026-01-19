import { supabase } from "@/integrations/supabase/client";

export async function deleteBarber(barberId: string): Promise<void> {
  // Deletar o barbeiro da tabela staff
  const { error: barberError } = await supabase
    .from("staff")
    .delete()
    .eq("id", barberId);

  if (barberError) throw barberError;
}

export async function createBarber(barberData: any): Promise<string> {
  // Criar o registro na tabela staff
  const { data: barber, error: barberError } = await supabase
    .from("staff")
    .insert([{
      name: barberData.name,
      email: barberData.email,
      phone: barberData.phone,
      image_url: barberData.image_url,
      specialties: barberData.specialties,
      experience: barberData.experience,
      commission_rate: barberData.commission_rate,
      role: 'barber',
      is_active: true
    }])
    .select()
    .single();

  if (barberError) throw barberError;

  // Sincronizar com painel_barbeiros se existir staff_id correspondente
  await syncStaffPhotoToPainelBarbeiros(barber.id, barberData.image_url);

  return barber.id;
}

export async function updateBarber(barberId: string, barberData: any): Promise<void> {
  // Atualizar os dados na tabela staff
  const { error: barberError } = await supabase
    .from("staff")
    .update({
      name: barberData.name,
      email: barberData.email,
      phone: barberData.phone,
      image_url: barberData.image_url,
      specialties: barberData.specialties,
      experience: barberData.experience,
      commission_rate: barberData.commission_rate
    })
    .eq("id", barberId);

  if (barberError) throw barberError;

  // Sincronizar foto com painel_barbeiros
  await syncStaffPhotoToPainelBarbeiros(barberId, barberData.image_url);
}

/**
 * Sincroniza a foto da tabela staff para painel_barbeiros
 * Isso garante que o Totem e outras telas que usam painel_barbeiros
 * tenham acesso às fotos atualizadas
 */
async function syncStaffPhotoToPainelBarbeiros(staffId: string, imageUrl: string | null): Promise<void> {
  try {
    // Buscar o registro em painel_barbeiros que tem staff_id = staffId
    const { data: painelBarbeiro, error: findError } = await supabase
      .from('painel_barbeiros')
      .select('id')
      .eq('staff_id', staffId)
      .maybeSingle();

    if (findError) {
      console.warn('Erro ao buscar painel_barbeiros:', findError);
      return;
    }

    if (painelBarbeiro) {
      // Atualizar a foto no painel_barbeiros
      const { error: updateError } = await supabase
        .from('painel_barbeiros')
        .update({ 
          image_url: imageUrl,
          foto_url: imageUrl 
        })
        .eq('id', painelBarbeiro.id);

      if (updateError) {
        console.warn('Erro ao sincronizar foto para painel_barbeiros:', updateError);
      } else {
        console.log('✅ Foto sincronizada com painel_barbeiros');
      }
    }
  } catch (error) {
    console.warn('Erro ao sincronizar foto:', error);
  }
}
