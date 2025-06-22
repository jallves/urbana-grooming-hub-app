
import { supabase } from "@/integrations/supabase/client";

export async function deleteBarber(barberId: string): Promise<void> {
  // Primeiro, buscar o staff_id do barbeiro
  const { data: barberData, error: fetchError } = await supabase
    .from("barbers")
    .select("staff_id")
    .eq("id", barberId)
    .single();

  if (fetchError) throw fetchError;

  // Deletar o barbeiro da tabela barbers
  const { error: barberError } = await supabase
    .from("barbers")
    .delete()
    .eq("id", barberId);

  if (barberError) throw barberError;

  // Opcionalmente, desativar o staff ao invés de deletar
  if (barberData?.staff_id) {
    const { error: staffError } = await supabase
      .from("staff")
      .update({ is_active: false })
      .eq("id", barberData.staff_id);

    if (staffError) throw staffError;
  }
}

export async function createBarber(staffData: any): Promise<string> {
  // Primeiro criar o registro na tabela staff
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .insert([{
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      image_url: staffData.image_url,
      specialties: staffData.specialties,
      experience: staffData.experience,
      commission_rate: staffData.commission_rate,
      role: 'barber',
      is_active: true
    }])
    .select()
    .single();

  if (staffError) throw staffError;

  // Depois criar o registro na tabela barbers
  const { data: barber, error: barberError } = await supabase
    .from("barbers")
    .insert([{
      staff_id: staff.id,
      user_id: staffData.user_id || null
    }])
    .select()
    .single();

  if (barberError) throw barberError;

  return barber.id;
}

export async function updateBarber(barberId: string, staffData: any): Promise<void> {
  // Buscar o staff_id do barbeiro
  const { data: barberData, error: fetchError } = await supabase
    .from("barbers")
    .select("staff_id")
    .eq("id", barberId)
    .single();

  if (fetchError) throw fetchError;

  // Atualizar os dados na tabela staff
  const { error: staffError } = await supabase
    .from("staff")
    .update({
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      image_url: staffData.image_url,
      specialties: staffData.specialties,
      experience: staffData.experience,
      commission_rate: staffData.commission_rate
    })
    .eq("id", barberData.staff_id);

  if (staffError) throw staffError;

  // Atualizar dados específicos do barbeiro se necessário
  if (staffData.user_id !== undefined) {
    const { error: barberError } = await supabase
      .from("barbers")
      .update({
        user_id: staffData.user_id
      })
      .eq("id", barberId);

    if (barberError) throw barberError;
  }
}
