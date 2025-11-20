
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

  return barber.id;
}

export async function updateBarber(barberId: string, barberData: any): Promise<void> {
  console.log('[barberService] updateBarber chamado');
  console.log('[barberService] ID do barbeiro:', barberId);
  console.log('[barberService] Dados para atualização:', barberData);
  
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

  if (barberError) {
    console.error('[barberService] Erro ao atualizar barbeiro:', barberError);
    throw barberError;
  }
  
  console.log('[barberService] Barbeiro atualizado com sucesso');
}
